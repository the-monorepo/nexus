import { examples } from '../util/from-examples';
import * as openapi from '../../packages/openapi';
import { extractTypeInfo, DefaultTypeName, NumberFormat } from '../../packages/types';
describe('mixed root types', () => {
  it('examples with different root values', () => {
    const examples = [{}, 1, ''];
    const typeInfo = extractTypeInfo(examples);
    expect(typeInfo).toEqual({
      types: [
        { name: DefaultTypeName.string },
        { name: DefaultTypeName.number, format: NumberFormat.integer },
        {
          name: DefaultTypeName.object,
          fields: {},
        },
      ],
      undefinedCount: 0,
      nullCount: 0,
    });
  });
});
