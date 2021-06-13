import { DefaultTypeName, NumberFormat } from '@byexample/types';

import { examples } from '../util/from-examples.ts';

describe('single types', () => {
  describe('function', () => {
    examples([() => {}])
      .typeInfo({
        types: [{ name: DefaultTypeName.function }],
        nullCount: 0,
        undefinedCount: 0,
      })
      .storybook.toThrowError();
  });
  describe('boolean', () => {
    examples([true])
      .typeInfo({
        types: [{ name: DefaultTypeName.boolean }],
        nullCount: 0,
        undefinedCount: 0,
      })
      .storybook.toThrowError();
  });
  describe('string', () => {
    examples([''])
      .typeInfo({
        types: [
          {
            name: DefaultTypeName.string,
          },
        ],
        nullCount: 0,
        undefinedCount: 0,
      })
      .storybook.toThrowError();
  });

  describe('integer', () => {
    examples([1])
      .typeInfo({
        types: [
          {
            name: DefaultTypeName.number,
            format: NumberFormat.integer,
          },
        ],
        nullCount: 0,
        undefinedCount: 0,
      })
      .storybook.toThrowError();
  });
});
