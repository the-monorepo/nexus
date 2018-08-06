import { examples } from '../util/from-examples';
import * as openapi from '../../packages/openapi';
import { extractTypeInfo, DefaultTypeName, NumberFormat } from '../../packages/types';
describe('mixed root types', () => {
  describe('every default type', () => {
    examples([[], {}, 1, '', true, () => {}]).typeInfo({
      types: expect.arrayContaining([
        {
          name: DefaultTypeName.array,
          items: { types: [], undefinedCount: 0, nullCount: 0 },
        },
        { name: DefaultTypeName.object, fields: {} },
        { name: DefaultTypeName.number, format: NumberFormat.integer },
        { name: DefaultTypeName.string },
        {
          name: DefaultTypeName.boolean,
        },
        {
          name: DefaultTypeName.function,
        },
      ]),
      undefinedCount: 0,
      nullCount: 0,
    });
  });
});
