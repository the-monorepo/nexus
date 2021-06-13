import { DefaultTypeName, NumberFormat } from '@byexample/types';

import { examples } from '../util/from-examples.ts';

describe('arrays', () => {
  describe('different types in seperate arrays', () => {
    examples([[1], ['string']])
      .typeInfo({
        types: [
          {
            name: DefaultTypeName.array,
            items: {
              types: [
                { name: DefaultTypeName.string },
                { name: DefaultTypeName.number, format: NumberFormat.integer },
              ],
              nullCount: 0,
              undefinedCount: 0,
            },
          },
        ],
        nullCount: 0,
        undefinedCount: 0,
      })
      .storybook.toThrowError();
  });
  describe('string elements', () => {
    examples([['', '1', 'undefined', 'null']])
      .typeInfo({
        types: [
          {
            name: DefaultTypeName.array,
            items: {
              types: [{ name: DefaultTypeName.string }],
              undefinedCount: 0,
              nullCount: 0,
            },
          },
        ],
        undefinedCount: 0,
        nullCount: 0,
      })
      .storybook.toThrowError();
  });
  describe('different element types', () => {
    examples([[1, 'string', null]])
      .typeInfo({
        types: [
          {
            name: DefaultTypeName.array,
            items: {
              types: [
                { name: DefaultTypeName.string },
                { name: DefaultTypeName.number, format: NumberFormat.integer },
              ],
              nullCount: 1,
              undefinedCount: 0,
            },
          },
        ],
        nullCount: 0,
        undefinedCount: 0,
      })
      .storybook.toThrowError();
  });
});
