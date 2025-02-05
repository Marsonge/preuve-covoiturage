export const alias = 'observatory.evolMonthlyOccupation';
export const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['year', 'month', 'type', 'code', 'indic'],
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
      enum: ['com', 'epci', 'aom', 'dep', 'reg', 'country'],
    },
    code: {
      type: 'string',
      minLength: 2,
      maxLength: 9,
    },
    indic: {
      type: 'string',
      enum: ['journeys', 'trips', 'has_incentive', 'occupation_rate'],
    },
    past: {
      type: 'string',
      minLength: 1,
      maxLength: 2,
      default: '2',
    },
  },
};

export const binding = [alias, schema];
