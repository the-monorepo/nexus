import { examples } from '../util/from-examples';
import { DefaultTypeName, NumberFormat } from '../../packages/types';
import { text, boolean, number, object, array, color } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
describe('objects', () => {
  describe('2 objects with all fields', () => {
    examples([
      {
        int: 1,
        string: '',
      },
      {
        int: 0,
        string: 'e',
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
      })
      .storybook([
        {
          int: number(1),
          string: text(''),
        },
        {
          int: number(0),
          string: text('e'),
        },
      ]);
  });
  describe('2 objects with different fields', () => {
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
  describe('object with every default type', () => {
    const fn = () => {};
    examples([
      {
        array: [],
        object: {},
        number: 1.1,
        string: 'e',
        boolean: true,
        fn,
      },
    ])
      .typeInfo({
        types: [
          {
            name: DefaultTypeName.object,
            fields: {
              array: {
                types: [
                  {
                    name: DefaultTypeName.array,
                    items: {
                      types: [],
                      undefinedCount: 0,
                      nullCount: 0,
                    },
                  },
                ],
                undefinedCount: 0,
                nullCount: 0,
              },
              object: {
                types: [{ name: DefaultTypeName.object, fields: {} }],
                undefinedCount: 0,
                nullCount: 0,
              },
              number: {
                types: [{ name: DefaultTypeName.number, format: NumberFormat.none }],
                undefinedCount: 0,
                nullCount: 0,
              },
              string: {
                types: [{ name: DefaultTypeName.string }],
                undefinedCount: 0,
                nullCount: 0,
              },
              boolean: {
                types: [{ name: DefaultTypeName.boolean }],
                undefinedCount: 0,
                nullCount: 0,
              },
              fn: {
                types: [{ name: DefaultTypeName.function }],
                undefinedCount: 0,
                nullCount: 0,
              },
            },
          },
        ],
        nullCount: 0,
        undefinedCount: 0,
      })
      .storybook([
        {
          array: array([]),
          object: object({}),
          number: number(1.1),
          string: text(''),
          boolean: boolean(true),
          fn: action(),
        },
      ]);
  });
});
