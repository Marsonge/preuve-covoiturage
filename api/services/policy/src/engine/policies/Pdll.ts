import {
  OperatorsEnum,
  PolicyHandlerInterface,
  PolicyHandlerParamsInterface,
  PolicyHandlerStaticInterface,
  StatefulContextInterface,
  StatelessContextInterface,
} from '../../interfaces';
import { NotEligibleTargetException } from '../exceptions/NotEligibleTargetException';
import {
  endsAt,
  isOperatorClassOrThrow,
  isOperatorOrThrow,
  onDistanceRange,
  onDistanceRangeOrThrow,
  perKm,
  perSeat,
  setMax,
  startsAt,
  watchForGlobalMaxAmount,
  watchForPersonMaxTripByDay,
} from '../helpers';
import { MaximumTargetEnum } from '../helpers/max';
import { startsAndEndsAt } from '../helpers/position';
import { description } from './Pdll.html';

export const Pdll: PolicyHandlerStaticInterface = class implements PolicyHandlerInterface {
  static readonly id = '249';
  protected operators = [OperatorsEnum.BlaBlaDaily, OperatorsEnum.Karos, OperatorsEnum.Klaxit, OperatorsEnum.Mobicoop];
  protected slices = [
    { start: 2000, end: 20000, fn: (ctx: StatelessContextInterface) => perSeat(ctx, 200) },
    { start: 20000, end: 50000, fn: (ctx: StatelessContextInterface) => perSeat(ctx, perKm(ctx, { amount: 10 })) },
  ];
  protected limits = [
    setMax('5499304F-2C64-AB1A-7392-52FF88F5E78D', 200000000, watchForGlobalMaxAmount),
    setMax('8C5251E8-AB82-EB29-C87A-2BF59D4F6328', 6, watchForPersonMaxTripByDay, MaximumTargetEnum.Driver),
  ];

  protected processExclusion(ctx: StatelessContextInterface) {
    isOperatorOrThrow(ctx, this.operators);
    onDistanceRangeOrThrow(ctx, { min: 2000 });
    isOperatorClassOrThrow(ctx, ['B', 'C']);

    // Exclure les trajets NM->NM, Angers->Angers, Le Mans->Le Mans
    if (
      startsAndEndsAt(ctx, { aom: ['244900015'] }) ||
      startsAndEndsAt(ctx, { aom: ['244400404'] }) ||
      startsAndEndsAt(ctx, { aom: ['247200132'] }) ||
      startsAndEndsAt(ctx, { aom: ['200071678'] })
    ) {
      throw new NotEligibleTargetException();
    }

    // Exclure les trajets qui ne sont pas dans l'aom
    if (!startsAt(ctx, { reg: ['52'] }) || !endsAt(ctx, { reg: ['52'] })) {
      throw new NotEligibleTargetException();
    }
  }

  processStateless(ctx: StatelessContextInterface): void {
    this.processExclusion(ctx);

    // Mise en place des limites
    for (const limit of this.limits) {
      const [staless] = limit;
      staless(ctx);
    }

    // Par kilomètre
    let amount = 0;
    for (const { start, end, fn } of this.slices) {
      if (onDistanceRange(ctx, { min: start, max: end })) {
        amount = fn(ctx);
      }
    }

    ctx.incentive.set(amount);
  }

  processStateful(ctx: StatefulContextInterface): void {
    for (const limit of this.limits) {
      const [, stateful] = limit;
      stateful(ctx);
    }
  }

  params(): PolicyHandlerParamsInterface {
    return {
      slices: this.slices,
      operators: this.operators,
      limits: {
        glob: 200000000,
      },
    };
  }

  describe(): string {
    return description;
  }
};
