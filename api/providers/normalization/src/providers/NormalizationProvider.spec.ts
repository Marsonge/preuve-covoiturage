import { Container } from '@ilos/core';
import test from 'ava';

import { GeoProviderInterfaceResolver } from '@pdc/provider-geo';
import { NormalizationProvider } from './NormalizationProvider';
import { CostNormalizerProvider } from './CostNormalizerProvider';
import { PartialGeoInterface, PointInterface } from '@pdc/provider-geo/dist/interfaces';
import { provider } from '@ilos/common';
import { randomUUID } from 'crypto';

class CostMock extends CostNormalizerProvider {
  protected async getSiret(operatorId: number): Promise<string> {
    return `siret-${operatorId}`;
  }
}

@provider()
class GeoMock extends GeoProviderInterfaceResolver {
  async checkAndComplete(data: PartialGeoInterface) {
    return {
      lat: data.lat || 0,
      lon: data.lon || 0,
      geo_code: 'geo_code',
    };
  }

  async getRouteMeta(start: PointInterface, end: PointInterface) {
    return {
      distance: 1000,
      duration: 500,
    };
  }
}

function setup() {
  const container = new Container();
  container.bind(NormalizationProvider).to(NormalizationProvider);
  container.bind(CostNormalizerProvider).to(CostMock);
  container.bind(GeoProviderInterfaceResolver).to(GeoMock);

  return container.get(NormalizationProvider);
}

test('Should throw if data has no version', async (t) => {
  const provider = setup();
  const data = {} as any;
  const err = await t.throwsAsync(async () => {
    await provider.handle(data);
  });
  t.is(err.message, '[normalization] Unknown API version undefined');
});

test('Should normalize v2', async (t) => {
  const provider = setup();
  const data = {
    _id: 1,
    operator_id: 1,
    api_version: 2,
    created_at: new Date(),
    payload: {
      journey_id: randomUUID(),
      operator_journey_id: randomUUID(),
      operator_class: 'C',
      passenger: {
        identity: {
          phone_trunc: '+336000000',
          operator_user_id: randomUUID(),
          over_18: true,
        },
        start: {
          datetime: new Date('2023-04-01T01:01:01.000Z'),
          lat: 47.74942,
          lon: 2.42909,
        },
        end: {
          datetime: new Date('2023-04-01T01:31:01.000Z'),
          lat: 47.84905,
          lon: 2.06105,
        },
        seats: 1,
        contribution: 0,
        incentives: [],
        distance: 10000,
        duration: 1800,
      },
      driver: {
        identity: {
          phone_trunc: '+33010101',
          operator_user_id: randomUUID(),
          over_18: true,
        },
        start: {
          datetime: new Date('2023-04-01T01:01:01.000Z'),
          lat: 47.74942,
          lon: 2.42909,
        },
        end: {
          datetime: new Date('2023-04-01T01:31:01.000Z'),
          lat: 47.84905,
          lon: 2.06105,
        },
        revenue: 200,
        incentives: [
          {
            index: 0,
            siret: '13002526500013',
            amount: 150,
          },
          {
            index: 1,
            siret: '38529030900454',
            amount: 50,
          },
        ],
        distance: 10000,
        duration: 1800,
      },
      operator_id: 1,
    },
  };
  const normalizedData = await provider.handle(data);
  t.deepEqual(normalizedData, {
    acquisition_id: data._id,
    created_at: data.created_at,
    incentives: data.payload.driver.incentives,
    operator_class: data.payload.operator_class,
    operator_id: data.operator_id,
    operator_journey_id: data.payload.journey_id,
    operator_trip_id: data.payload.operator_journey_id,
    people: [
      {
        cost: 200,
        datetime: data.payload.driver.start.datetime,
        distance: data.payload.driver.distance,
        duration: data.payload.driver.duration,
        start: {
          lat: data.payload.driver.start.lat,
          lon: data.payload.driver.start.lon,
          geo_code: 'geo_code',
        },
        end: {
          lat: data.payload.driver.end.lat,
          lon: data.payload.driver.end.lon,
          geo_code: 'geo_code',
        },
        is_driver: true,
        seats: 0,
        payment: 0,
        identity: {
          operator_user_id: data.payload.driver.identity.operator_user_id,
          over_18: data.payload.driver.identity.over_18,
          phone_trunc: data.payload.driver.identity.phone_trunc,
        },
        meta: {
          calc_duration: 500,
          calc_distance: 1000,
          incentive_counterparts: [],
          payments: data.payload.driver.incentives.map((i) => ({ ...i, type: 'incentive' })),
        },
      },
      {
        cost: 200,
        datetime: data.payload.passenger.start.datetime,
        distance: data.payload.passenger.distance,
        duration: data.payload.passenger.duration,
        start: {
          lat: data.payload.passenger.start.lat,
          lon: data.payload.passenger.start.lon,
          geo_code: 'geo_code',
        },
        end: {
          lat: data.payload.passenger.end.lat,
          lon: data.payload.passenger.end.lon,
          geo_code: 'geo_code',
        },
        is_driver: false,
        seats: 1,
        payment: 0,
        identity: {
          operator_user_id: data.payload.passenger.identity.operator_user_id,
          over_18: data.payload.passenger.identity.over_18,
          phone_trunc: data.payload.passenger.identity.phone_trunc,
        },
        meta: {
          calc_duration: 500,
          calc_distance: 1000,
          incentive_counterparts: [],
          payments: data.payload.driver.incentives.map((i) => ({ ...i, type: 'incentive' })),
        },
      },
    ],
  });
});

test('Should normalize v3', async (t) => {
  const provider = setup();
  const data = {
    _id: 1,
    operator_id: 1,
    api_version: 3,
    created_at: new Date(),
    payload: {
      incentive_counterparts: [
        {
          target: 'passenger' as any,
          siret: '13002526500013',
          amount: 150,
        },
      ],
      operator_journey_id: randomUUID(),
      operator_trip_id: randomUUID(),
      operator_class: 'C',
      incentives: [
        {
          index: 0,
          siret: '13002526500013',
          amount: 150,
        },
      ],
      start: {
        datetime: new Date('2023-04-01T01:01:01.000Z'),
        lat: 47.74942,
        lon: 2.42909,
      },
      end: {
        datetime: new Date('2023-04-01T01:31:01.000Z'),
        lat: 47.84905,
        lon: 2.06105,
      },
      distance: 10000,
      driver: {
        identity: {
          identity_key: randomUUID(),
          operator_user_id: randomUUID(),
          over_18: true,
        },
        revenue: 200,
      },
      passenger: {
        identity: {
          identity_key: randomUUID(),
          operator_user_id: randomUUID(),
        },
        contribution: 50,
        payments: [
          {
            index: 0,
            siret: '38529030900454',
            amount: 50,
            type: 'payment',
          },
        ],
        seats: 1,
      },
      licence_plate: 'licence_plate',
    },
  };
  const normalizedData = await provider.handle(data);
  t.deepEqual(normalizedData, {
    acquisition_id: data._id,
    created_at: data.created_at,
    incentives: data.payload.incentives,
    operator_class: data.payload.operator_class,
    operator_id: data.operator_id,
    operator_journey_id: data.payload.operator_journey_id,
    operator_trip_id: data.payload.operator_trip_id,
    people: [
      {
        cost: 200,
        datetime: data.payload.start.datetime,
        distance: data.payload.distance,
        duration: 1800,
        start: {
          lat: data.payload.start.lat,
          lon: data.payload.start.lon,
          geo_code: 'geo_code',
        },
        end: {
          lat: data.payload.end.lat,
          lon: data.payload.end.lon,
          geo_code: 'geo_code',
        },
        is_driver: true,
        seats: 0,
        payment: 200,
        identity: {
          operator_user_id: data.payload.driver.identity.operator_user_id,
          identity_key: data.payload.driver.identity.identity_key,
          over_18: data.payload.driver.identity.over_18,
        },
        meta: {
          calc_duration: 500,
          calc_distance: 1000,
          incentive_counterparts: [],
          payments: [],
        },
      },
      {
        cost: 200,
        datetime: data.payload.start.datetime,
        distance: data.payload.distance,
        duration: 1800,
        start: {
          lat: data.payload.start.lat,
          lon: data.payload.start.lon,
          geo_code: 'geo_code',
        },
        end: {
          lat: data.payload.end.lat,
          lon: data.payload.end.lon,
          geo_code: 'geo_code',
        },
        is_driver: false,
        seats: 1,
        payment: 50,
        identity: {
          operator_user_id: data.payload.passenger.identity.operator_user_id,
          identity_key: data.payload.passenger.identity.identity_key,
        },
        meta: {
          calc_duration: 500,
          calc_distance: 1000,
          incentive_counterparts: data.payload.incentive_counterparts,
          payments: data.payload.passenger.payments,
        },
      },
    ],
  });
});
