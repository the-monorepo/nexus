import { examples } from '../util/from-examples';
import { DefaultTypeName, NumberFormat } from '@by-example/types';
describe('arrays', () => {
  it('different types in seperate arrays', () => {
    examples([[1], ['string']]).typeInfo({
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
    });
  });
  it('string elements', () => {
    examples([['', '1', 'undefined', 'null']]).typeInfo({
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
    });
  });
  it('different element types', () => {
    examples([[1, 'string', null]]).typeInfo({
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
    });
  });
});
