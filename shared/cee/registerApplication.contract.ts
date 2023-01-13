import { CeeAplicationResultInterface, CeeApplicationInterface } from './common/CeeApplicationInterface';

export type ParamsInterface = CeeApplicationInterface;

export interface ResultInterface extends CeeAplicationResultInterface {}

export const handlerConfig = {
  service: 'cee',
  method: 'registerCeeApplication',
};

export const signature = `${handlerConfig.service}:${handlerConfig.method}`;