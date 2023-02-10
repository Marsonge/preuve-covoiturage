import {
  OperatorsEnum,
  PolicyHandlerInterface,
  PolicyHandlerParamsInterface,
  PolicyHandlerStaticInterface,
  StatelessContextInterface,
} from '../../interfaces';
import {
  isOperatorClassOrThrow,
  isOperatorOrThrow,
  onDistanceRange,
  onDistanceRangeOrThrow,
  perKm,
  perSeat,
  watchForGlobalMaxAmount,
  watchForPersonMaxTripByDay,
  LimitTargetEnum,
  ConfiguredLimitInterface,
  ensureFreeRide,
} from '../helpers';
import { AbstractPolicyHandler } from './AbstractPolicyHandler';
import { description } from './Mrn.html';

// Politique de Métropole Rouen Normandie
export const Mrn: PolicyHandlerStaticInterface = class extends AbstractPolicyHandler implements PolicyHandlerInterface {
  static readonly id = '766';
  protected operators = [OperatorsEnum.Klaxit];
  protected slices = [
    { start: 2_000, end: 20_000, fn: (ctx: StatelessContextInterface) => perSeat(ctx, 200) },
    {
      start: 20_000,
      end: 40_000,
      fn: (ctx: StatelessContextInterface) => perSeat(ctx, perKm(ctx, { amount: 10, offset: 20_000, limit: 40_000 })),
    },
    {
      start: 40_000,
      end: 150_000,
      fn: () => 0,
    },
  ];
  private readonly MAX_GLOBAL_AMOUNT_LIMIT = 2_500_000_00;

  protected limits: Array<ConfiguredLimitInterface> = [
    ['E7B969E7-D701-2B9F-80D2-B30A7C3A5220', 6, watchForPersonMaxTripByDay, LimitTargetEnum.Driver],
    ['489A7D57-1948-61DA-E5FA-1AE3217325BA', this.MAX_GLOBAL_AMOUNT_LIMIT, watchForGlobalMaxAmount],
  ];

  protected processExclusion(ctx: StatelessContextInterface) {
    isOperatorOrThrow(ctx, this.operators);
    onDistanceRangeOrThrow(ctx, { min: 2_000, max: 150_000 });
    isOperatorClassOrThrow(ctx, ['B', 'C']);
  }

  processStateless(ctx: StatelessContextInterface): void {
    this.processExclusion(ctx);
    super.processStateless(ctx);

    // Par kilomètre
    let amount = 0;
    for (const { start, fn } of this.slices) {
      if (onDistanceRange(ctx, { min: start })) {
        amount += fn(ctx);
      }
    }

    amount += ensureFreeRide(ctx, amount);

    ctx.incentive.set(amount);
  }

  params(): PolicyHandlerParamsInterface {
    return {
      slices: this.slices,
      operators: this.operators,
      limits: {
        glob: this.MAX_GLOBAL_AMOUNT_LIMIT,
      },
    };
  }

  describe(): string {
    return description;
  }
};