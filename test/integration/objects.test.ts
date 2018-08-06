import { examples } from '../util/from-examples';
import { DefaultTypeName, NumberFormat } from '../../packages/types';
describe('objects', () => {
  it('2 objects with all fields', () => {
    examples([
      {
        int: 1,
        string: '',
      },
      {
        int: 1,
        string: '',
      },
    ])
      .typeInfo({
        types: [
          {
            name: DefaultTypeName.object,
            fields: {
              int: {
                types: [{ name: DefaultTypeName.number, format: NumberFormat.integer }],
                nullCount: 0,
                undefinedCount: 0,
              },
              string: {
                types: [{ name: DefaultTypeName.string }],
                nullCount: 0,
                undefinedCount: 0,
              },
            },
          },
        ],
        undefinedCount: 0,
        nullCount: 0,
      })
      .openapi({
        type: 'object',
        required: ['int', 'string'],
        properties: {
          int: { type: 'integer' },
          string: { type: 'string' },
        },
      });
  });
  it('2 objects with different fields', () => {
    examples([
      {
        int: -1,
      },
      {
        string: 'a',
      },
    ])
      .typeInfo({
        types: [
          {
            name: DefaultTypeName.object,
            fields: {
              int: {
                types: [{ name: DefaultTypeName.number, format: NumberFormat.integer }],
                nullCount: 0,
                undefinedCount: 1,
              },
              string: {
                types: [{ name: DefaultTypeName.string }],
                nullCount: 0,
                undefinedCount: 1,
              },
            },
          },
        ],
        undefinedCount: 0,
        nullCount: 0,
      })
      .openapi({
        type: 'object',
        properties: {
          int: { type: 'integer' },
          string: { type: 'string' },
        },
      });
  });
});
