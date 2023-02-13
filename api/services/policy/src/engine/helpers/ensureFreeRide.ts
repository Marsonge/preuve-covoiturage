import { StatelessContextInterface } from '../../shared/policy/common/interfaces/PolicyInterface';

export const ensureFreeRide = (ctx: StatelessContextInterface, amount: number): number => {
  return Math.max(0, ctx.carpool.cost - amount);
};
