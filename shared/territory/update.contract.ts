import { TerritoryGroupInterface, UpdateTerritoryGroupInterface } from './common/interfaces/TerritoryInterface';

export interface ParamsInterface extends UpdateTerritoryGroupInterface {}
export interface ResultInterface extends TerritoryGroupInterface {}

export const handlerConfig = {
  service: 'territory',
  method: 'update',
};

export const signature = `${handlerConfig.service}:${handlerConfig.method}`;
