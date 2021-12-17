export interface PositionInterface {
  datetime: Date;
  country?: string;
  geo_code?: string;
  lon?: number;
  lat?: number;
  literal?: string;
  postcodes?: string[];
  town?: string;
  territory_id?: number;
}
