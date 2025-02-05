import { provider } from '@ilos/common';

import { CheckHandleCallback, HandleCheckInterface } from '../../../interfaces';
import { SelfCheckParamsInterface } from './SelfCheckParamsInterface';
import { SelfCheckPreparator } from '../SelfCheckPreparator';
import { step } from '../../helpers/math';

/*
 * Check start longitude collision
 */
@provider()
export class StartLongitudeCollisionCheck implements HandleCheckInterface<SelfCheckParamsInterface> {
  public static readonly key: string = 'startLongitudeCollisionCheck';
  public readonly preparer = SelfCheckPreparator;

  protected readonly max: number = 1; // above = 100
  protected readonly min: number = 0.001; // below = 0

  async handle(params: SelfCheckParamsInterface, cb: CheckHandleCallback): Promise<void> {
    const { driver_start_lon, passenger_start_lon } = params;
    cb(step(Math.abs(passenger_start_lon - driver_start_lon), this.min, this.max));
  }
}
