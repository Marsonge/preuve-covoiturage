import { macro } from './macro';
import { weekendTrafficLimitPolicy } from './weekendTrafficLimitPolicy';

const { test, results } = macro({
  ...weekendTrafficLimitPolicy,
  territory_id: 1,
  status: 'active',
  start_date: new Date('2019-01-01'),
  end_date: new Date('2019-02-01'),
});

test.skip(results, [
  { carpool_id: 10, amount: 0 },
  { carpool_id: 11, amount: 0 },
  { carpool_id: 34, amount: 0 },
  { carpool_id: 35, amount: 0 },
  { carpool_id: 44, amount: 0 },
  { carpool_id: 45, amount: 0 },
  { carpool_id: 54, amount: 0 },
  { carpool_id: 55, amount: 0 },
  { carpool_id: 66, amount: 0 },
  { carpool_id: 67, amount: 0 },
  { carpool_id: 74, amount: 0 },
  { carpool_id: 75, amount: 0 },
  { carpool_id: 86, amount: 150 },
  { carpool_id: 87, amount: 0 },
]);
