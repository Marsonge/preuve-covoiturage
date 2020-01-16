export const alias = 'certificate.print';
export const schema = {
  $id: alias,
  type: 'object',
  required: ['identity'],
  additionalProperties: false,
  properties: {
    identity: { type: 'string', maxLength: 64 },
    start_at: { macro: 'timestamp' },
    end_at: { macro: 'timestamp' },
    type: { type: 'string', enum: ['png', 'pdf', 'json'], maxLength: 4 },
  },
};
export const binding = [alias, schema];
