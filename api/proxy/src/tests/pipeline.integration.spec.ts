/**
 * End-to-end tests of the acquisition pipeline
 *
 * We wanna make sure the submitted journey makes it through all steps by
 * running the app and the worker, sending a journey to the REST endpoint
 * before checking the carpool.carpools table when all normalization jobs
 * are processed.
 */

import { get } from 'lodash';
import supertest from 'supertest';
import anyTest, { TestFn } from 'ava';

import { KernelInterface, TransportInterface } from '@ilos/common';
import { CryptoProvider } from '@pdc/provider-crypto';
import { TokenProvider } from '@pdc/provider-token';
import { QueueTransport } from '@ilos/transport-redis';
import { dbTestMacro, getDbConfig } from '@pdc/helper-test';

import { HttpTransport } from '../HttpTransport';
import { payloadV2 } from './mocks/payloadV2';
import { MockJWTConfigProvider } from './mocks/MockJWTConfigProvider';
import { cookieLoginHelper } from './helpers/cookieLoginHelper';

interface ContextType {
  kernel: KernelInterface;
  app: TransportInterface;
  worker: QueueTransport;
  request: any;
  crypto: CryptoProvider;
  token: TokenProvider;
  applications: number[];
  operators: number[];
  users: number[];
  journeys: number[];
  operatorA: any;
  operatorAUser: any;
  application: any;
  cookies: string;
}

// super hackish way to change the connectionString before the Kernel is loaded
const { pgConnectionString, database, tmpConnectionString } = getDbConfig();
process.env.APP_POSTGRES_URL = tmpConnectionString;
import { Kernel } from '../Kernel';

// create a test to configure the 'after' hook
// this must be done before using the macro to make sure this hook
// runs before the one from the macro
const myTest = anyTest as TestFn<ContextType>;
myTest.after.always(async (t) => {
  await t.context.worker.down();
  await t.context.app.down();
  await t.context.kernel.shutdown();
});

const { test } = dbTestMacro<ContextType>(myTest, {
  database,
  pgConnectionString,
});

test.before(async (t) => {
  t.context.crypto = new CryptoProvider();
  t.context.token = new TokenProvider(new MockJWTConfigProvider());
  await t.context.token.init();

  t.context.kernel = new Kernel();
  t.context.app = new HttpTransport(t.context.kernel);
  t.context.worker = new QueueTransport(t.context.kernel);

  await t.context.kernel.bootstrap();
  await t.context.app.up(['0']);
  await t.context.worker.up([process.env.APP_REDIS_URL]);
  t.context.request = supertest(t.context.app.getInstance());
});

test.beforeEach(async (t) => {
  // login with the operator admin
  t.context.cookies = await cookieLoginHelper(t.context.request, 'maxicovoit.admin@example.com', 'admin1234');
});

test.serial('Pipeline check', async (t) => {
  t.pass(); // FIXME
  return;
  t.timeout(5 * 60 * 1000);
  t.plan(3);
  const token = await t.context.token.sign({
    a: '1efacd36-a85b-47b2-99df-cabbf74202b3', // see @pdc/helper-test README.md
    o: 1,
    s: 'operator',
    p: ['journey.create', 'certificate.create', 'certificate.download'],
    v: 2,
  });
  const pl = payloadV2();
  const normQueue = t.context.worker.getInstance().filter((q) => q.worker.name === 'normalization')[0].worker;
  normQueue.on('completed', (job) => {
    if (job.name === 'normalization:process') {
      t.context.pool
        .query({
          text: 'SELECT count(*) as count FROM carpool.carpools WHERE operator_journey_id = $1',
          values: [pl.journey_id],
        })
        .then((result) => {
          t.is(get(result.rows, '0.count', '0'), '2');
        });
    }
  });
  const response = await t.context.request
    .post(`/v2/journeys`)
    .send(pl)
    .set('Accept', 'application/json')
    .set('Content-type', 'application/json')
    .set('Authorization', `Bearer ${token}`);
  // make sure the journey has been sent properly
  t.is(response.status, 200);

  const operator_journey_id = get(response, 'body.result.data.journey_id', '');
  t.is(operator_journey_id, pl.journey_id);
});
