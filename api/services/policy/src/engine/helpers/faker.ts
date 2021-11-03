import { TripInterface, PersonInterface } from '../../interfaces';

const datetime = new Date('2019-01-15');

const basePerson: PersonInterface = {
  datetime,
  carpool_id: 1,
  identity_uuid: 'person',
  is_over_18: true,
  has_travel_pass: false,
  operator_id: 1,
  operator_class: 'C',
  is_driver: false,
  seats: 1,
  duration: 600,
  distance: 5000,
  cost: 2,
  start_territory_id: [1],
  end_territory_id: [1],
};

const baseTrip: TripInterface = new TripInterface();

function trip(people: Partial<PersonInterface>[] = []): TripInterface {
  return new TripInterface(...baseTrip, ...people.map((p) => ({ ...basePerson, ...p })));
}

export const faker = {
  trip,
};
