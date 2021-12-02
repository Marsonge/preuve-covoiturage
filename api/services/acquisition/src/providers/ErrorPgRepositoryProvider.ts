import { provider } from '@ilos/common';
import { PostgresConnection } from '@ilos/connection-postgres';

import { AcquisitionErrorInterface } from '../shared/acquisition/common/interfaces/AcquisitionErrorInterface';
import {
  ErrorRepositoryProviderInterface,
  ErrorRepositoryProviderInterfaceResolver,
  SearchParamsInterface,
  SummaryParamsInterface,
} from '../interfaces/ErrorRepositoryProviderInterface';
import {
  ParamsInterface as LogParamsInterface,
  ResultInterface as LogResultInterface,
} from '../shared/acquisition/logerror.contract';
import {
  ParamsInterface as ResolveParamsInterface,
  ResultInterface as ResolveResultInterface,
} from '../shared/acquisition/resolveerror.contract';

@provider({
  identifier: ErrorRepositoryProviderInterfaceResolver,
})
export class ErrorPgRepositoryProvider implements ErrorRepositoryProviderInterface {
  public readonly table = 'acquisition.errors';

  constructor(protected connection: PostgresConnection) {}

  protected searchWhere(data: SearchParamsInterface): { wheres: string[]; values: any[] } {
    const wheres = [];
    const values = [];

    if (data.journey_id !== undefined) {
      wheres.push(`journey_id = $${wheres.length + 1}`);
      values.push(data.journey_id);
    }

    if (data.error_stage !== undefined) {
      wheres.push(`error_stage = $${wheres.length + 1}`);
      values.push(data.error_stage);
    }

    if (data.operator_id !== undefined) {
      wheres.push(`operator_id = $${wheres.length + 1}`);
      values.push(data.operator_id);
    }

    if (data.error_code !== undefined) {
      wheres.push(`error_code = $${wheres.length + 1}`);
      values.push(data.error_code);
    }

    if (data.start_date !== undefined) {
      wheres.push(`created_at >= $${wheres.length + 1}`);
      values.push(data.start_date.toISOString());
    }

    if (data.end_date !== undefined) {
      wheres.push(`created_at < $${wheres.length + 1}`);
      values.push(data.end_date.toISOString());
    }

    return {
      wheres,
      values,
    };
  }

  async summary(filter: SummaryParamsInterface): Promise<{ [key: string]: number }> {
    const { wheres, values } = this.searchWhere(filter);

    const query = {
      text: `SELECT COUNT(_id) as count, ${filter.group_by} as group_base FROM ${this.table} ${
        wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
      } GROUP BY ${filter.group_by}`,
      values,
    };

    const rows = (await this.connection.getClient().query<{ group_base: number | string; count: string }>(query)).rows;

    const res: {} = {};

    for (const row of rows) {
      res[row.group_base.toString()] = parseFloat(row.count);
    }

    return res;
  }

  async search(filter: SearchParamsInterface): Promise<AcquisitionErrorInterface[]> {
    const { wheres, values } = this.searchWhere(filter);

    const query = {
      text: `SELECT *  FROM ${this.table} ${wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''}`,
      values,
    };

    return (await this.connection.getClient().query<AcquisitionErrorInterface>(query)).rows;
  }

  async resolve(data: ResolveParamsInterface): Promise<ResolveResultInterface> {
    const query = {
      text: `
        UPDATE ${this.table} SET error_resolved = TRUE
        WHERE operator_id = $1 AND journey_id = $2 AND error_stage = $3
      `,
      values: [data.operator_id, data.journey_id, data.error_stage],
    };

    return await (
      await this.connection.getClient().query(query)
    ).rows.length;
  }

  async log(data: LogParamsInterface): Promise<LogResultInterface> {
    let attempt: number;
    if (data.error_attempt == undefined) {
      const query = {
        text: `
          SELECT error_attempt FROM ${this.table}
          WHERE operator_id = $1 AND journey_id = $2 AND error_stage = $3
        `,
        values: [data.operator_id, data.journey_id, data.error_stage],
      };

      const result = await this.connection.getClient().query(query);
      attempt = result.rowCount > 0 ? parseFloat(result.rows[0].error_attempt) + 1 : 1;
    } else {
      attempt = data.error_attempt;
    }

    const query = {
      text: `
        INSERT INTO ${this.table}
        ( operator_id,
          journey_id,
          source,
          error_message,
          error_code,
          error_line,
          auth,
          headers,
          body,
          error_stage,
          error_attempt,
          error_resolved )
        VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12 )
        RETURNING _id, created_at
      `,
      values: [
        data.operator_id,
        data.journey_id,
        data.source,
        data.error_message,
        data.error_code,
        data.error_line,
        data.auth,
        data.headers,
        data.body,
        data.error_stage,
        attempt,
        false,
      ],
    };

    const result = await this.connection.getClient().query(query);

    return result.rows[0];
  }

  async findByJourneyAndOperator(journey_id: string, operator_id: number): Promise<AcquisitionErrorInterface[]> {
    const result = await this.connection.getClient().query({
      text: `
        SELECT * FROM ${this.table}
        WHERE journey_id = $1::varchar AND operator_id = $2::int
      `,
      values: [journey_id, operator_id],
    });

    return result.rows;
  }
}
