import { examples } from '../util/from-examples';
import * as openapi from '@by-example/openapi';
import { extractTypeInfo, DefaultTypeName, NumberFormat } from '@by-example/types';
describe('combined', () => {
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
    ]).typeInfo({
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
    ]).typeInfo({
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
    });
  });

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

  it('arrays', () => {
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
