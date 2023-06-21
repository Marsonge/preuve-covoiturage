import { PostgresConnection } from '@ilos/connection-postgres';
import { NotFoundException, provider } from '@ilos/common';

import { PointInterface, InseeCoderInterface } from '../interfaces';

@provider()
export class LocalGeoProvider implements InseeCoderInterface {
  protected fn = 'geo.get_latest_by_point';
  protected fbcom = 'geo.get_closest_com';
  protected fbcountry = 'geo.get_closest_country';

  constructor(protected connection: PostgresConnection) {}

  async positionToInsee(geo: PointInterface): Promise<string> {
    const { lat, lon } = geo;

    const positionInCom = await this.connection.getClient().query({
      text: `
        SELECT arr
        FROM ${this.fn}($1::float, $2::float)
        WHERE arr <> 'XXXXX'
      `,
      values: [lon, lat],
    });

    const positionClosestCom = await this.connection.getClient().query({
      text: `
        SELECT arr
        FROM ${this.fbcom}($1::float, $2::float)
      `,
      values: [lon, lat],
    });

    const positionClosestCountry = await this.connection.getClient().query({
      text: `
        SELECT arr
        FROM ${this.fbcountry}($1::float, $2::float)
      `,
      values: [lon, lat],
    });

    if (positionInCom.rowCount > 0) {
      return positionInCom.rows[0].arr;
    } 
    if (positionClosestCom.rowCount > 0) {
      return positionClosestCom.rows[0].arr;
    }
    if (positionClosestCountry.rowCount === 0) {
      throw new NotFoundException();
    }
    return positionClosestCountry.rows[0].arr;
  }
}
