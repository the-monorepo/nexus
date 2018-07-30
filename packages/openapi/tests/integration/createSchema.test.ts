import { createSchema } from '../../src/index';
import { extractTypeInfo, DefaultTypeName } from '@by-example/types';
import SwaggerParser from 'swagger-parser';
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

describe('createSchema', () => {
  describe('valid schema', () => {
    testWithValidation('Simple object', () => {
      const typeInfo = extractTypeInfo([
        {
          string: 'string',
          required: 1,
          float: 1.2,
          nullableBoolean: null,
        },
        {
          required: 2,
          nullableBoolean: true,
        },
      ]);
      const schema = createSchema(typeInfo);
      expect(schema).toEqual({
        type: 'object',
        required: ['required', 'nullableBoolean'],
        properties: {
          string: { type: 'string' },
          required: { type: 'integer' },
          float: { type: 'number' },
          nullableBoolean: { type: 'boolean', nullable: true },
        },
      });
      return schema;
    });
  });
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
      required: ['nested'],
      properties: {
        nested: {
          type: 'object',
          required: ['string'],
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
    });
  });
});
