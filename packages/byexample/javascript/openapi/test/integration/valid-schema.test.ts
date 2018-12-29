import SwaggerParser from 'swagger-parser';

import { DefaultTypeName, NumberFormat } from '@byexample/types';

import { createSchema } from '../../src/index.ts';
function testWithValidation(name, callback) {
  it(name, async () => {
    const schema = callback();
    const spec: any = {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Test',
      },
      paths: {},
      components: {
        schemas: {
          Test: schema,
        },
      },
    };
    const validatePromise = SwaggerParser.validate(spec);
    await expect(validatePromise).resolves.toEqual(expect.anything());
  });
}

describe('valid schema', () => {
  testWithValidation('Simple object', () => {
    const schema = createSchema({
      types: [
        {
          name: DefaultTypeName.object,
          fields: {
            arrayOfStrings: {
              types: [
                {
                  name: DefaultTypeName.array,
                  items: {
                    types: [{ name: DefaultTypeName.string }],
                    undefiendCount: 0,
                    nullCount: 0,
                  },
                },
              ],
              undefinedCount: 0,
              nullCount: 0,
            },
            nullableOptionalStringOrBoolean: {
              types: [
                { name: DefaultTypeName.string },
                { name: DefaultTypeName.boolean },
              ],
              undefinedCount: 1,
              nullCount: 1,
            },
            string: {
              types: [{ name: DefaultTypeName.string }],
              undefinedCount: 0,
              nullCount: 0,
            },
            integer: {
              types: [{ name: DefaultTypeName.number, format: NumberFormat.integer }],
              undefinedCount: 0,
              nullCount: 0,
            },
            number: {
              types: [{ name: DefaultTypeName.number }],
              undefinedCount: 0,
              nullCount: 0,
            },
          },
        },
      ],
      nullCount: 0,
      undefinedCount: 0,
    });
    expect(schema).toEqual({
      type: 'object',
      required: ['arrayOfStrings', 'string', 'integer', 'number'],
      properties: {
        arrayOfStrings: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        nullableOptionalStringOrBoolean: {
          oneOf: [
            {
              type: 'string',
              nullable: true,
            },
            {
              type: 'boolean',
              nullable: true,
            },
          ],
        },
        integer: {
          type: 'integer',
        },
        number: {
          type: 'number',
        },
        string: {
          type: 'string',
        },
      },
    });
    return schema;
  });
});
