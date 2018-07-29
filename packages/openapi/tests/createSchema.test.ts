import { createSchema } from '../src/index';
import { extractTypeInfo, DefaultTypeName } from '@by-example/types';
describe('createSchema', () => {
  it('nested object', () => {
    const typeInfo = extractTypeInfo([
      {
        nested: {
          string: 'string',
        },
      },
    ]);
    const schema = createSchema(typeInfo);
    expect(schema).toEqual({
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          properties: {
            string: {
              type: 'string',
            },
          },
        },
      },
    });
  });

  it('string & object', () => {
    const typeInfo = extractTypeInfo(['string', {}]);
    const schema = createSchema(typeInfo);
    expect(schema).toEqual({
      oneOf: [
        {
          type: 'string',
        },
        {
          type: 'object',
          properties: {},
        },
      ],
    });
  });
});
