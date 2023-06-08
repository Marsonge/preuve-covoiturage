import { perimeterTypes } from '../../geo/shared/Perimeter';

export const alias = 'observatory.monthlyFlux';
export const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['year', 'month', 'type', 'observe', 'code'],
  properties: {
    year: {
      type: 'integer',
      minimum: 2020,
    },
    month: {
      type: 'integer',
      minimum: 1,
      maximum: 12,
    },
    type: {
      type: 'string',
      enum: perimeterTypes,
    },
    observe: {
      type: 'string',
      enum: perimeterTypes,
    },
    code: {
      type: 'string',
      minLength: 2,
      maxLength: 9,
    },
  },
};

export const binding = [alias, schema];
