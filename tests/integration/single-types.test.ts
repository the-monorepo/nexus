import { examples } from '../util/from-examples';
import { DefaultTypeName, NumberFormat } from '@by-example/types';
describe('single types', () => {
  it('function', () => {
    examples([() => {}]).typeInfo({
      types: [{ name: DefaultTypeName.function }],
      nullCount: 0,
      undefinedCount: 0,
    });
  });
  it('boolean', () => {
    examples([true]).typeInfo({
      types: [{ name: DefaultTypeName.boolean }],
      nullCount: 0,
      undefinedCount: 0,
    });
  });
  it('string', () => {
    examples(['']).typeInfo({
      types: [
        {
          name: DefaultTypeName.string,
        },
      ],
      nullCount: 0,
      undefinedCount: 0,
    });
  });

  it('integer', () => {
    examples([1]).typeInfo({
      types: [
        {
          name: DefaultTypeName.number,
          format: NumberFormat.integer,
        },
      ],
      nullCount: 0,
      undefinedCount: 0,
    });
  });
});
