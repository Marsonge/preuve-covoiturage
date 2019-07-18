import { get, uniq } from 'lodash';
import moment from 'moment';

import { Action } from '@ilos/core';
import { handler, ContextType } from '@ilos/common';
import { JourneyInterface, TripInterface, PersonInterface } from '@pdc/provider-schema';

import { CrosscheckRepositoryProviderInterfaceResolver } from '../interfaces/CrosscheckRepositoryProviderInterface';
import { Trip } from '../entities/Trip';
import { Person } from '../entities/Person';

interface CrosscheckProcessParamsInterface {
  journey: JourneyInterface;
}

/*
 * Build trip by connecting journeys by operator_id & operator_journey_id | driver phone & start time
 */
@handler({
  service: 'crosscheck',
  method: 'process',
})
export class CrosscheckProcessAction extends Action {
  public readonly middlewares: (string | [string, any])[] = [['validate', 'crosscheck.process']];
  constructor(private crosscheckRepository: CrosscheckRepositoryProviderInterfaceResolver) {
    super();
  }

  public async handle(params: CrosscheckProcessParamsInterface, context: ContextType): Promise<Trip | null> {
    let trip: TripInterface | null;

    try {
      trip = await this.crosscheckRepository.findByOperatorJourneyId({
        operator_journey_id: params.journey.operator_journey_id,
        operator_id: params.journey.operator_id,
      });
    } catch (e) {}

    try {
      const driverPhone = get(params.journey, 'driver.identity.phone', null);
      if (!driverPhone) {
        throw new Error(`No driver phone in: ${params.journey.journey_id}`);
      }

      const startTimeRange = {
        min: moment
          .utc(params.journey.driver.start.datetime)
          .subtract(2, 'h')
          .toDate(),
        max: moment
          .utc(params.journey.driver.start.datetime)
          .add(2, 'h')
          .toDate(),
      };

      trip = await this.crosscheckRepository.findByPhoneAndTimeRange(driverPhone, startTimeRange);
    } catch (e) {}

    return trip ? this.consolidateTripWithJourney(params.journey, trip) : this.createTripFromJourney(params.journey);
  }

  private async createTripFromJourney(journey: JourneyInterface): Promise<Trip> {
    const trip = new Trip({
      status: 'pending',
      territories: this.mapTerritories(journey),
      start: this.reduceStartDate(journey),
      people: this.mapPeople(journey),
    });

    return this.crosscheckRepository.create(trip);
  }

  private async consolidateTripWithJourney(journey: JourneyInterface, sourceTrip: TripInterface): Promise<Trip> {
    // extract existing phone number to compare identities
    const phones = uniq(sourceTrip.people.map((p: PersonInterface) => p.identity.phone));

    // filter mapped people by their phone number. Keep non matching ones
    const people = this.mapPeople(journey).filter(
      (person: PersonInterface) => phones.indexOf(person.identity.phone) === -1,
    );

    // filter mapped territories. Keep non matching ones
    const territories = this.mapTerritories(journey).filter(
      (territory: string) => sourceTrip.territories.indexOf(territory) === -1,
    );

    // find the oldest start date
    const newStartDate = this.reduceStartDate(journey, sourceTrip);

    return this.crosscheckRepository.findByIdAndPushPeople(sourceTrip._id, people, territories, newStartDate);
  }

  // map people from journey
  private mapPeople(journey: JourneyInterface): Person[] {
    const people: Person[] = [];

    if ('driver' in journey) {
      const driver = journey.driver;
      people.push(new Person({ is_driver: true, ...driver }));
    }

    if ('passenger' in journey) {
      const passenger = journey.passenger;
      people.push(new Person({ is_driver: false, ...passenger }));
    }

    return people;
  }

  // find the oldest start date
  private reduceStartDate(journey: JourneyInterface, trip: TripInterface | null = null): Date {
    if (trip) {
      const arr: Date[] = [journey.driver.start.datetime, trip.start];

      return arr.reduce((p, c) => (new Date(p).getTime() < new Date(c).getTime() ? p : c), new Date());
    }

    return journey.driver.start.datetime;
  }

  // get all territories from journey
  private mapTerritories(journey: JourneyInterface): string[] {
    let territories: string[] = [];

    if ('driver' in journey) {
      territories = territories.concat(journey.driver.start.territories);
      territories = territories.concat(journey.driver.end.territories);
    }
    if ('passenger' in journey) {
      territories = territories.concat(journey.driver.start.territories);
      territories = territories.concat(journey.driver.end.territories);
    }

    return uniq(territories);
  }
}