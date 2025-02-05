import { selfCheckMacro } from './selfCheckMacro';
import { ServiceProvider } from '../../../ServiceProvider';
import { EndLatitudeCollisionCheck } from './EndLatitudeCollisionCheck';

const { test, range } = selfCheckMacro(ServiceProvider, EndLatitudeCollisionCheck);

test('max', range, { driver_end_lat: 1 }, 1, 1, true);
test('min', range, { driver_end_lat: 0 }, 0, 0, true);
test('between', range, { driver_end_lat: 0.5 }, 0, 1, true);
