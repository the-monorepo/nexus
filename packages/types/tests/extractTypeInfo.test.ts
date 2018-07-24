import { extractTypeInfo } from '../src/index';
import { DefaultTypeName } from '../src/DefaultTypeName';
import { NumberFormat } from '../src/type-info-types';
describe(extractTypeInfo.name, () => {
  it('string', () => {
    const typeInfo = extractTypeInfo(['']);
    expect(typeInfo).toEqual({
      types: [
        {
          type: DefaultTypeName.string,
        },
      ],
      nullCount: 0,
      undefinedCount: 0,
    });
  });

  it('integer', () => {
    const typeInfo = extractTypeInfo([1]);
    expect(typeInfo).toEqual({
      types: [
        {
          type: DefaultTypeName.number,
          format: NumberFormat.integer,
        },
      ],
      nullCount: 0,
      undefinedCount: 0,
    });
  });

  it('2 objects with all fields', () => {
    const examples = [
      {
        int: 1,
        string: '',
      },
      {
        int: 1,
        string: '',
      },
    ];
    const typeInfo = extractTypeInfo(examples);
    expect(typeInfo).toEqual({
      types: [
        {
          type: DefaultTypeName.object,
          fields: {
            int: {
              types: [{ type: DefaultTypeName.number, format: NumberFormat.integer }],
              nullCount: 0,
              undefinedCount: 0,
            },
            string: {
              types: [{ type: DefaultTypeName.string }],
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
    const examples = [
      {
        int: -1,
      },
      {
        string: 'a',
      },
    ];
    const typeInfo = extractTypeInfo(examples);
    expect(typeInfo).toEqual({
      types: [
        {
          type: DefaultTypeName.object,
          fields: {
            int: {
              types: [{ type: DefaultTypeName.number, format: NumberFormat.integer }],
              nullCount: 0,
              undefinedCount: 0,
            },
            string: {
              types: [{ type: DefaultTypeName.string }],
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

  it('examples with different root values', () => {
    const examples = [{}, 1, ''];
    const typeInfo = extractTypeInfo(examples);
    expect(typeInfo).toEqual({
      types: [
        { type: DefaultTypeName.string },
        { type: DefaultTypeName.number, format: NumberFormat.none },
        {
          type: DefaultTypeName.object,
          fields: {},
        },
      ],
      undefinedCount: 0,
      nullCount: 0,
    });
  });

  it('arrays', () => {
    const examples = [[1, 'string', null]];
    const typeInfo = extractTypeInfo(examples);
    expect(typeInfo).toEqual({
      types: [
        {
          type: DefaultTypeName.array,
          items: {
            types: [
              { type: DefaultTypeName.string },
              { type: DefaultTypeName.number, format: NumberFormat.none },
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
