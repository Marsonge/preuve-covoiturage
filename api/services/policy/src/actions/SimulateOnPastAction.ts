import { handler, KernelInterfaceResolver } from '@ilos/common';
import { Action as AbstractAction } from '@ilos/core';
import { copyGroupIdAndApplyGroupPermissionMiddlewares, validateDateMiddleware } from '@pdc/provider-middleware';

import { handlerConfig, ParamsInterface, ResultInterface } from '../shared/policy/simulateOnPastGeo.contract';
import {
  signature as geoSignature,
  ParamsInterface as GeoParamsInterface,
  ResultInterface as GeoResultInterface,
} from '../shared/territory/findGeoBySiren.contract';

import { alias } from '../shared/policy/simulateOn.schema';
import { TripRepositoryProviderInterfaceResolver, TerritoryRepositoryProviderInterfaceResolver } from '../interfaces';
import { Policy } from '../engine/entities/Policy';
import { MetadataStore } from '../engine/entities/MetadataStore';

@handler({
  ...handlerConfig,
  middlewares: [
    ['validate', alias],
    validateDateMiddleware({
      startPath: 'policy.start_date',
      endPath: 'policy.end_date',
      minStart: () => new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 31 * 5),
      maxEnd: () => new Date(),
    }),
    ...copyGroupIdAndApplyGroupPermissionMiddlewares(
      { territory: 'territory.policy.simulate.past', registry: 'registry.policy.simulate.past' },
      'policy',
    ),
  ],
})
export class SimulateOnPastAction extends AbstractAction {
  constructor(
    private tripRepository: TripRepositoryProviderInterfaceResolver,
    private kernel: KernelInterfaceResolver,
  ) {
    super();
  }

  public async handle(params: ParamsInterface): Promise<ResultInterface> {
    // 0 find related com
    const geoParamsInterface: GeoParamsInterface = {
      siren: params.territory_insee,
    };
    const geoResult: GeoResultInterface = await this.kernel.call<GeoParamsInterface>(geoSignature, geoParamsInterface, {
      call: {
        user: {},
      },
      channel: {
        service: handlerConfig.service,
      },
    });

    // 1. Find selector and instanciate policy
    const policy = await Policy.import({ ...params.policy, territory_selector, _id: 1 });

    // 2. Start a cursor to find trips
    const cursor = this.tripRepository.findTripByGeo(
      geoResult.coms.map((m) => m.insee),
      policy.start_date,
      policy.end_date,
    );
    let done = false;

    let carpool_total = 0;
    let carpool_subsidized = 0;
    let amount = 0;

    const store = new MetadataStore();
    do {
      const results = await cursor.next();
      done = results.done;
      if (results.value) {
        for (const carpool of results.value) {
          // 3. For each trip, process
          const incentive = await policy.processStateless(carpool);
          const finalIncentive = await policy.processStateful(store, incentive.export());
          const finalAmount = finalIncentive.get();
          carpool_total += 1;
          if (finalAmount > 0) {
            carpool_subsidized += 1;
          }
          amount += finalAmount;
        }
      }
    } while (!done);

    // TODO approximation à éviter
    return {
      trip_subsidized: carpool_subsidized,
      trip_excluded: carpool_total / 2 - carpool_subsidized,
      amount,
    };
  }
}
