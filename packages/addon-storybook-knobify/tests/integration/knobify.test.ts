import { knobify } from '../../src/index';
import { extractTypeInfo } from '@by-example/types';
import { text, boolean, number, object, array, color } from '@storybook/addon-knobs';

describe('knobify', () => {
  it('can knobify', () => {
    const examples: any = [
      {
        string: 'string',
        color: '#FFFFFF',
        boolean: true,
        object: {},
      },
      {
        integer: 1,
        float: 1.2,
        array: [],
      },
    ];

    const typeInfo = extractTypeInfo(examples);
    knobify(examples, typeInfo);

    expect(examples).toEqual([
      {
        string: text('string'),
        color: color('#FFFFFF'),
        boolean: boolean(true),
        object: object({}),
      },
      {
        integer: number(1),
        float: number(1.2),
        array: array([]),
      },
    ]);
  });
});
