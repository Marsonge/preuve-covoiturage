import { Timezone } from '@pdc/provider-validator';
import { UnknownHandlerException } from '../exceptions/UnknownHandlerException';
import { isSelected } from '../helpers';
import {
  CarpoolInterface,
  MetadataStoreInterface,
  PolicyInterface,
  PolicyHandlerInterface,
  SerializedIncentiveInterface,
  SerializedPolicyInterface,
  StatefulIncentiveInterface,
  StatelessIncentiveInterface,
  PolicyHandlerParamsInterface,
  TerritorySelectorsInterface,
  StatelessContextInterface,
  PolicyHandlerStaticInterface,
} from '../../interfaces';
import { policies } from '../policies';
import { StatefulContext, StatelessContext } from './Context';
import { NotEligibleTargetException } from '../exceptions/NotEligibleTargetException';

export class Policy implements PolicyInterface {
  constructor(
    public _id: number,
    public territory_id: number,
    public territory_selector: TerritorySelectorsInterface,
    public name: string,
    public start_date: Date,
    public end_date: Date,
    public tz: Timezone,
    public handler: PolicyHandlerInterface,
    public status: string,
    public incentive_sum: number,
  ) {}

  static async import(data: SerializedPolicyInterface): Promise<Policy> {
    const ctor = policies.get(data.handler);
    if (!ctor) {
      throw new UnknownHandlerException();
    }

    return new Policy(
      data._id,
      data.territory_id,
      data.territory_selector,
      data.name,
      data.start_date,
      data.end_date,
      data.tz,
      new ctor(data.max_amount),
      data.status,
      data.incentive_sum,
    );
  }

  export(): SerializedPolicyInterface {
    return {
      _id: this._id,
      territory_id: this.territory_id,
      territory_selector: this.territory_selector,
      name: this.name,
      start_date: this.start_date,
      end_date: this.end_date,
      tz: this.tz,
      status: this.status,
      incentive_sum: this.incentive_sum,
      handler: (this.handler.constructor as PolicyHandlerStaticInterface).id,
      max_amount: this.handler.max_amount,
    };
  }

  async processStateless(carpool: CarpoolInterface): Promise<StatelessIncentiveInterface> {
    const context: StatelessContextInterface = StatelessContext.fromCarpool(this._id, carpool);
    context.policy_territory_selector = this.territory_selector;
    if (this.guard(carpool)) {
      try {
        this.handler.processStateless(context);
      } catch (e) {
        if (e instanceof NotEligibleTargetException) {
          context.incentive.set(0);
          return context.incentive;
        }
        console.error(`Statelesss incentive calculation for carpool ${carpool._id} failed : ${e.message}`);
        console.debug(e);
        throw e;
      }
    }
    return context.incentive;
  }

  async processStateful(
    store: MetadataStoreInterface,
    incentive: SerializedIncentiveInterface,
  ): Promise<StatefulIncentiveInterface> {
    try {
      const context = await StatefulContext.fromIncentive(store, incentive);
      if (context.meta.isEmpty() || context.incentive.get() === 0) {
        return context.incentive;
      }
      this.handler.processStateful(context);
      await store.save(context.meta);
      return context.incentive;
    } catch (e) {
      console.error(`Stateful incentive calculation failed for ${incentive._id}: ${e.message}`);
      console.debug(e);
      throw e;
    }
  }

  protected guard(carpool: CarpoolInterface): boolean {
    if (carpool.datetime < this.start_date) {
      return false;
    }

    if (carpool.datetime > this.end_date) {
      return false;
    }

    if (!this.territory_selector || Object.keys(this.territory_selector).length <= 0) {
      return true;
    }

    if (!isSelected(carpool.start, this.territory_selector) && !isSelected(carpool.end, this.territory_selector)) {
      return false;
    }

    return true;
  }

  params(): PolicyHandlerParamsInterface {
    return this.handler.params();
  }

  describe(): string {
    return this.handler.describe();
  }
}
