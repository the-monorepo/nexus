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
              required: true,
            },
          },
          required: true,
        },
      },
      required: true,
    });
  });

  it('string & object', () => {
    const typeInfo = extractTypeInfo(['string', {}]);
    const schema = createSchema(typeInfo);
    expect(schema).toEqual({
      oneOf: [
        {
          type: 'string',
          required: true,
        },
        {
          type: 'object',
          properties: {},
          required: true,
        },
      ],
    });
  });

  it('objects with different fields', () => {
    const typeInfo = extractTypeInfo([
      {
        string: 'string',
      },
      {
        number: 1,
      },
    ]);
    const schema = createSchema(typeInfo);
    expect(schema).toEqual({
      type: 'object',
      properties: {
        string: {
          type: 'string',
        },
        number: {
          type: 'integer',
        },
      },
      required: true,
    });
  });
});
