import { ApiGraphTimeMode } from './ApiGraphTimeMode';

export interface TripSearchInterface {
  campaign_id?: number[];
  tz?: string;
  date?: {
    start?: Date;
    end?: Date;
  };
  days?: number[];
  status?: string;
  distance?: {
    min?: number;
    max?: number;
  };
  ranks?: string[];
  operator_id?: number[];
  territory_id?: number[];
}

export interface TripSearchInterfaceWithPagination extends TripSearchInterface {
  skip: number;
  limit: number;
}
