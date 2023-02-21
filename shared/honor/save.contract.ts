export type ResultInterface = void;

export interface ParamsInterface {
  type: string;
}

export const handlerConfig = {
  service: 'honor',
  method: 'save',
} as const;

export const signature = `${handlerConfig.service}:${handlerConfig.method}`;
