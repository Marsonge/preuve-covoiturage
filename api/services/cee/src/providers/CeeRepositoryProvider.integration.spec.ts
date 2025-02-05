import anyTest, { TestFn } from 'ava';
import { makeDbBeforeAfter, DbContext } from '@pdc/helper-test';

import { CeeRepositoryProvider } from './CeeRepositoryProvider';
import { config } from '../config';
import {
  CeeApplicationErrorEnum,
  CeeJourneyTypeEnum,
  LongCeeApplication,
  SearchCeeApplication,
  SearchJourney,
  ShortCeeApplication,
  ValidJourneyConstraint,
} from '../interfaces';

interface TestContext {
  db: DbContext;
  repository: CeeRepositoryProvider;
}

const test = anyTest as TestFn<TestContext>;
const { before, after } = makeDbBeforeAfter();

test.serial.before(async (t) => {
  const db = await before();
  t.context.db = db;
  t.context.repository = new CeeRepositoryProvider(t.context.db.connection);
});

test.serial.after.always(async (t) => {
  await after(t.context.db);
});

test.serial('Should find a valid journey', async (t) => {
  const search: SearchJourney = {
    operator_id: 1,
    operator_journey_id: 'operator_journey_id-1',
  };

  const constraint: ValidJourneyConstraint = {
    ...config.rules.validJourneyConstraint,
    start_date: new Date('2022-01-01'),
  };

  const result = await t.context.repository.searchForValidJourney(search, constraint);
  t.not(result, undefined);
  t.is(result.phone_trunc, '+336000000');
});

test.serial('Should throw error is no valid journey found', async (t) => {
  const search: SearchJourney = {
    operator_id: 1,
    operator_journey_id: 'operator_journey_id-1',
  };

  const constraint: ValidJourneyConstraint = {
    ...config.rules.validJourneyConstraint,
    start_date: new Date('2022-01-01'),
    max_distance: 0,
  };

  const error = await t.throwsAsync(async () => t.context.repository.searchForValidJourney(search, constraint));
  t.not(error, undefined);
});

test.serial('Should create short application', async (t) => {
  const application: ShortCeeApplication = {
    operator_id: 1,
    last_name_trunc: 'AAA',
    phone_trunc: '+3360000000000',
    datetime: new Date('2022-11-01'),
    application_timestamp: new Date('2022-11-01'),
    driving_license: 'driving_license_1',
    carpool_id: 1,
  };

  await t.context.repository.registerShortApplication(application, config.rules.applicationCooldownConstraint);

  const applicationResults = await t.context.db.connection.getClient().query({
    text: `SELECT ${Object.keys(application).join(',')}, journey_type FROM ${
      t.context.repository.table
    } WHERE operator_id = $1 and last_name_trunc = $2`,
    values: [1, 'AAA'],
  });

  t.is(applicationResults.rowCount, 1);
  t.deepEqual(applicationResults.rows[0], { journey_type: 'short', ...application });
});

test.serial('Should create long application', async (t) => {
  const application: LongCeeApplication = {
    operator_id: 1,
    last_name_trunc: 'BBB',
    phone_trunc: '+3360000000000',
    datetime: new Date('2022-11-01'),
    application_timestamp: new Date('2022-11-01'),
    driving_license: 'driving_license_1',
    identity_key: 'test',
  };

  await t.context.repository.registerLongApplication(application, config.rules.applicationCooldownConstraint);

  const applicationResults = await t.context.db.connection.getClient().query({
    text: `SELECT ${Object.keys(application).join(',')}, journey_type FROM ${
      t.context.repository.table
    } WHERE operator_id = $1 AND last_name_trunc = $2`,
    values: [1, 'BBB'],
  });

  t.is(applicationResults.rowCount, 1);
  t.is(applicationResults.rows[0]?.journey_type, 'long');
  t.truthy(!!applicationResults.rows[0]?.identity_key);
});

test.serial('Should raise error if conflict short application', async (t) => {
  const application: ShortCeeApplication = {
    operator_id: 1,
    last_name_trunc: 'AAA',
    phone_trunc: '+3360000000000',
    datetime: new Date('2022-11-02'),
    application_timestamp: new Date('2022-11-02'),
    driving_license: 'driving_license_1',
    carpool_id: 1,
  };

  const error = await t.throwsAsync(
    async () =>
      await t.context.repository.registerShortApplication(application, config.rules.applicationCooldownConstraint),
  );
  t.true(error instanceof Error);
});

test.serial('Should raise error if missing fields in short application', async (t) => {
  const application: any = {
    operator_id: 1,
    last_name_trunc: 'AAA',
    phone_trunc: '+3360000000000',
    datetime: new Date('2022-11-02'),
    driving_license: 'driving_license_1',
  };

  const error = await t.throwsAsync(
    async () =>
      await t.context.repository.registerShortApplication(application, config.rules.applicationCooldownConstraint),
  );
  t.true(error instanceof Error);
});

test.serial('Should find short application with id if exists', async (t) => {
  const search: SearchCeeApplication = {
    last_name_trunc: 'AAA',
    phone_trunc: '+3360000000000',
    datetime: new Date(),
  };

  const result = await t.context.repository.searchForShortApplication(
    search,
    config.rules.applicationCooldownConstraint,
  );
  t.not(result, undefined);
  t.deepEqual((result || {}).datetime, new Date('2022-11-01'));
});

test.serial('Should find short application with driver license if exists', async (t) => {
  const search: SearchCeeApplication = {
    last_name_trunc: 'BBB',
    phone_trunc: '+3360000000001',
    driving_license: 'driving_license_1',
    datetime: new Date(),
  };

  const result = await t.context.repository.searchForShortApplication(
    search,
    config.rules.applicationCooldownConstraint,
  );
  t.not(result, undefined);
  t.deepEqual((result || {}).datetime, new Date('2022-11-01'));
});

test.serial('Should not find short application if criterias dont match', async (t) => {
  const search: SearchCeeApplication = {
    last_name_trunc: 'BBB',
    phone_trunc: '+3360000000001',
    driving_license: 'driving_license_2',
    datetime: new Date(),
  };

  const result = await t.context.repository.searchForShortApplication(
    search,
    config.rules.applicationCooldownConstraint,
  );
  t.is(result, undefined);
});

test.serial('Should match cooldown criteria', async (t) => {
  const app1 = {
    application_timestamp: new Date('2014-01-01T00:00:00.000Z'),
    operator_id: 1,
    last_name_trunc: 'CCC',
    phone_trunc: '+336123456',
    datetime: new Date('2014-01-01T00:00:00.000Z'),
    journey_type: CeeJourneyTypeEnum.Long,
  };
  const app2 = {
    application_timestamp: new Date('2016-01-01T00:00:00.000Z'),
    operator_id: 1,
    last_name_trunc: 'DDD',
    phone_trunc: '+336123457',
    datetime: new Date('2016-01-01T00:00:00.000Z'),
    journey_type: CeeJourneyTypeEnum.Long,
  };
  const data = [app1, app2];

  for (const application of data) {
    await t.context.repository.importApplication(application);
  }

  const result = await t.context.repository.searchForLongApplication(
    {
      last_name_trunc: 'CCC',
      phone_trunc: '+336123456',
      datetime: new Date(),
    },
    config.rules.applicationCooldownConstraint,
  );
  t.is(result, undefined);

  const result2 = await t.context.repository.searchForLongApplication(
    {
      last_name_trunc: 'DDD',
      phone_trunc: '+336123457',
      datetime: new Date(),
    },
    config.rules.applicationCooldownConstraint,
  );
  t.like(result2, { datetime: new Date('2016-01-01T00:00:00.000Z') });

  await t.notThrowsAsync(async () => {
    await t.context.repository.registerLongApplication(
      { ...app1, driving_license: 'toto' },
      config.rules.applicationCooldownConstraint,
    );
  });
  await t.throwsAsync(async () => {
    await t.context.repository.registerLongApplication(
      { ...app2, driving_license: 'toto2' },
      config.rules.applicationCooldownConstraint,
    );
  });
});

test.serial('Should resgister application error', async (t) => {
  const uuidResult = await t.context.db.connection
    .getClient()
    .query(`SELECT _id FROM ${t.context.repository.table} LIMIT 1`);
  const data1 = {
    operator_id: 1,
    error_type: CeeApplicationErrorEnum.Conflict,
    journey_type: CeeJourneyTypeEnum.Long,
    last_name_trunc: 'TOT',
    operator_journey_id: 'TOTO',
  };
  await t.context.repository.registerApplicationError(data1);

  const data2 = {
    operator_id: 1,
    error_type: CeeApplicationErrorEnum.Date,
    journey_type: CeeJourneyTypeEnum.Long,
    datetime: new Date().toISOString(),
    driving_license: 'TOTO',
    application_id: uuidResult.rows[0]?._id,
  };
  await t.context.repository.registerApplicationError(data2);

  const errorResults = await t.context.db.connection.getClient().query({
    text: `SELECT * FROM ${t.context.repository.errorTable} ORDER BY created_at`,
    values: [],
  });

  t.is(errorResults.rowCount, 2);
  t.like(errorResults.rows[0], { ...data1 });
  t.like(errorResults.rows[1], { ...data2 });
});

test.serial('Should import identity_key', async (t) => {
  const app1 = {
    application_timestamp: new Date('2014-01-01T00:00:00.000Z'),
    operator_id: 1,
    last_name_trunc: 'CCC',
    phone_trunc: '+336123456',
    datetime: new Date('2014-01-01T00:00:00.000Z'),
    journey_type: CeeJourneyTypeEnum.Long,
    identity_key: 'id',
  };

  await t.context.repository.importSpecificApplicationIdentity(app1);
  const result1 = await t.context.db.connection.getClient().query({
    text: `SELECT identity_key FROM ${t.context.repository.table} WHERE phone_trunc = $1`,
    values: [app1.phone_trunc],
  });
  t.is(result1.rows[0].identity_key, app1.identity_key);

  await t.throwsAsync(async () => t.context.repository.importSpecificApplicationIdentity(app1));

  const uuidResult = await t.context.db.connection.getClient().query(
    `SELECT
        _id as cee_application_uuid, operator_id
      FROM ${t.context.repository.table}
      WHERE
        identity_key is null AND is_specific = false
      LIMIT 1`,
  );
  const app2 = {
    ...uuidResult.rows[0],
    identity_key: 'id2',
  };
  await t.context.repository.importStandardizedApplicationIdentity(app2);
  const result2 = await t.context.db.connection.getClient().query({
    text: `SELECT identity_key FROM ${t.context.repository.table} WHERE _id = $1`,
    values: [app2.cee_application_uuid],
  });
  t.is(result2.rows[0].identity_key, app2.identity_key);
  await t.throwsAsync(async () => t.context.repository.importStandardizedApplicationIdentity(app2));
});
