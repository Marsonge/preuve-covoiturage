import { provider } from '@ilos/common';
import { PoolClient, PostgresConnection } from '@ilos/connection-postgres';

import {
  FraudCheckRepositoryProviderInterfaceResolver,
  FraudCheckEntry,
  FraudCheckRepositoryUpdateCallback,
  SearchInterface,
  FraudCheck,
} from '../interfaces';

@provider({
  identifier: FraudCheckRepositoryProviderInterfaceResolver,
})
export class FraudCheckRepositoryProvider extends FraudCheckRepositoryProviderInterfaceResolver {
  public readonly table = 'fraudcheck.fraudchecks';
  public readonly resultTable = 'fraudcheck.results';
  public readonly populateFn = 'populate_fraud_from_carpool';

  constructor(public connection: PostgresConnection) {
    super();
  }

  async populate(hours: number) {
    await this.connection.getClient().query({
      text: `SELECT ${this.populateFn}($1::int)`,
      values: [hours],
    });
  }

  async findThenUpdate(
    search: SearchInterface,
    timeout = 10000,
  ): Promise<[Array<number>, FraudCheckRepositoryUpdateCallback]> {
    const whereClauses = ['from', 'to', 'status']
      .filter((k) => k in search)
      .map((k, i) => {
        switch (k) {
          case 'from':
            return {
              text: `created_at >= $${i + 1}::timestamp`,
              values: [search[k]],
            };
          case 'to':
            return {
              text: `created_at < $${i + 1}::timestamp`,
              values: [search[k]],
            };
          case 'status':
            return {
              text: `status = $${i + 1}::fraudcheck.status_enum`,
              values: [search[k]],
            };
        }
      })
      .reduce(
        (acc, v) => {
          const { text, values } = acc;
          text.push(v.text);
          values.push(...v.values);
          return { text, values };
        },
        { text: [], values: [] },
      );

    const query = {
      text: `
        SELECT 
          acquisition_id
        FROM ${this.table}
        WHERE ${whereClauses.text.join(' AND ')}
        ORDER BY acquisition_id
        LIMIT $${whereClauses.values.length + 1}
        FOR UPDATE SKIP LOCKED
      `,
      values: [...whereClauses.values, search.limit],
    };
    const pool = await this.connection.getClient().connect();
    try {
      await pool.query('BEGIN');
      const result = await pool.query<{ acquisition_id: number }>(query);
      let hasTimeout = false;
      const timeoutFn = setTimeout(() => {
        hasTimeout = true;
        pool.query('ROLLBACK').finally(() => pool.release());
      }, timeout);
      return [
        result.rows.map((r) => r.acquisition_id),
        // Callback à appeler pour enregistrer les résultats des tests
        // ou les erreurs ayant eu lieu.
        // Appelé sans data, le cb permet de commit la transaction
        // Si le timeout a été atteint, aucune écriture n'est possible
        async (data?: FraudCheckEntry) => {
          if (timeoutFn && !hasTimeout) {
            if (data) {
              await this.createOrUpdate(data, pool);
            } else {
              clearTimeout(timeoutFn);
              await pool.query('COMMIT');
              pool.release();
            }
          }
        },
      ];
    } catch (e) {
      await pool.query('ROLLBACK');
      pool.release();
      throw e;
    }
  }

  protected async createOrUpdateResults(data: FraudCheck[], pool: PoolClient): Promise<void> {
    if (data && data.length) {
      const values: [Array<number>, Array<string>, Array<string>, Array<string>, Array<number>, Array<string>] =
        data.reduce(
          ([acquisition_id, method, uuid, status, karma, extra], i) => {
            acquisition_id.push(i.acquisition_id);
            method.push(i.method);
            uuid.push(i.uuid);
            status.push(i.status);
            karma.push(i.karma);
            extra.push(JSON.stringify(i.data || {}));
            return [acquisition_id, method, uuid, status, karma, extra];
          },
          [[], [], [], [], [], []],
        );
      await pool.query({
        text: `
          INSERT INTO ${this.resultTable} (
            acquisition_id,
            method,
            uuid,
            status,
            karma,
            data
          ) SELECT * FROM UNNEST(
            $1::int[],
            $2::varchar[],
            $3::uuid[],
            $4::fraudcheck.status_enum[],
            $5::float[],
            $6::json[]
          )
        `,
        values,
      });
    }
  }

  public async createOrUpdate(data: FraudCheckEntry, poolClient?: PoolClient): Promise<void> {
    const pool = poolClient ?? (await this.connection.getClient().connect());
    await pool.query(poolClient ? 'SAVEPOINT results' : 'BEGIN');
    try {
      const query = {
        text: `
          INSERT INTO ${this.table} (
            acquisition_id,
            status,
            karma
          ) VALUES (
            $1::int,
            $2::fraudcheck.status_enum,
            $3::float
          )
          ON CONFLICT (acquisition_id)
          DO UPDATE SET (
            status,
            karma
          ) = (
            excluded.status,
            excluded.karma
          )
        `,
        values: [data.acquisition_id, data.status, data.karma],
      };
      await pool.query(query);
      await this.createOrUpdateResults(data.data, pool);
      await pool.query(poolClient ? 'RELEASE SAVEPOINT results' : 'COMMIT');
    } catch (e) {
      await pool.query(poolClient ? 'ROLLBACK TO SAVEPOINT results' : 'ROLLBACK');
      if (!poolClient) {
        throw e;
      }
    } finally {
      if (!poolClient) {
        pool.release();
      }
    }
    return;
  }
}
