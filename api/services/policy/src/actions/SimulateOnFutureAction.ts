import { handler } from '@ilos/common';
import { Action as AbstractAction } from '@ilos/core';
import { copyGroupIdAndApplyGroupPermissionMiddlewares } from '@pdc/provider-middleware';
import { differenceInSeconds } from 'date-fns';

import {
  handlerConfig,
  ParamsInterface,
  ParamsInterfaceV2,
  ParamsInterfaceV3,
  ResultInterface,
} from '../shared/policy/simulateOnFuture.contract';
import { alias } from '../shared/policy/simulateOnFuture.schema';
import {
  PolicyRepositoryProviderInterfaceResolver,
  TerritoryRepositoryProviderInterfaceResolver,
  CarpoolInterface,
  PolicyInterface,
  StatelessIncentiveInterface,
} from '../interfaces';
import { v4 } from 'uuid';
import { Policy } from '../engine/entities/Policy';

@handler({
  ...handlerConfig,
  middlewares: [
    ...copyGroupIdAndApplyGroupPermissionMiddlewares({
      operator: 'operator.simulate.future',
      registry: 'registry.simulate.future',
    }),
    ['validate', alias],
  ],
})
export class SimulateOnFutureAction extends AbstractAction {
  constructor(
    private territoryRepository: TerritoryRepositoryProviderInterfaceResolver,
    private policyRepository: PolicyRepositoryProviderInterfaceResolver,
  ) {
    super();
  }

  public async handle(params: ParamsInterface): Promise<ResultInterface> {
    // 1. Normalize trip by adding territory_id and identity stuff
    const data = await this.normalize(params);

    // 2. Get involved territories
    const territories = [
      ...new Set([
        ...(await this.territoryRepository.findBySelector(data.start)),
        ...(await this.territoryRepository.findBySelector(data.end)),
      ]),
    ];

    // 3. Find appliable policys and instanciate them
    const policysRaw = await this.policyRepository.findWhere({
      status: 'active',
      territory_id: territories,
      datetime: data.datetime,
    });

    const policies: Array<PolicyInterface> = [];
    for (const policyRaw of policysRaw) {
      policies.push(await Policy.import(policyRaw));
    }

    // 5. Process policies
    const incentives: StatelessIncentiveInterface[] = [];
    for (const policy of policies) {
      incentives.push(await policy.processStateless(data));
    }

    // 6. Get siret code for applied policies
    const sirets = await this.territoryRepository.findSiretById(policies.map((c) => c.territory_id));

    // 7. Normalize incentives output and return
    const normalizedIncentives = incentives
      .map((i) => i.export())
      .filter((i) => i.statelessAmount > 0)
      .map((i) => ({
        carpool_id: i.carpool_id,
        amount: i.statelessAmount,
        siret: sirets.find((s) => s._id === policies.find((c) => c._id === i.policy_id).territory_id).siret,
      }));

    return {
      journey_id: 'journey_id' in params ? params.journey_id : undefined,
      driver: normalizedIncentives.map((incentive, i) => ({
        index: i,
        amount: incentive.amount,
        siret: incentive.siret,
      })),
      passenger: [],
    };
  }

  protected async normalize(input: ParamsInterface): Promise<CarpoolInterface> {
    const common = {
      _id: 1,
      driver_identity_uuid: v4(),
      passenger_identity_uuid: v4(),
      trip_id: v4(),
      operator_siret: await this.territoryRepository.findSiretByOperatorId(input.operator_id),
      operator_class: input.operator_class,
      passenger_is_over_18: input.passenger.identity.over_18,
      driver_has_travel_pass: 'travel_pass' in input.driver.identity,
      passenger_has_travel_pass: 'travel_pass' in input.passenger.identity,
      seats: input.passenger.seats,
      driver_payment: input.driver.revenue,
      passenger_payment: input.passenger.contribution,
      cost: input.passenger.contribution,
    };

    switch (input.api_version) {
      case 'v2':
        const inputv2 = input as ParamsInterfaceV2;
        return {
          ...common,
          datetime: inputv2.passenger.start.datetime,
          duration: differenceInSeconds(inputv2.passenger.end.datetime, inputv2.passenger.start.datetime),
          distance: inputv2.passenger.distance,
          start: await this.territoryRepository.findByPoint(inputv2.passenger.start),
          end: await this.territoryRepository.findByPoint(inputv2.passenger.end),
        };
      case 'v3':
        const inputv3 = input as ParamsInterfaceV3;
        return {
          ...common,
          datetime: inputv3.start.datetime,
          duration: differenceInSeconds(inputv3.end.datetime, inputv3.start.datetime),
          distance: inputv3.distance,
          start: await this.territoryRepository.findByPoint(inputv3.start),
          end: await this.territoryRepository.findByPoint(inputv3.end),
        };
    }
  }
}
