import { fromExamples } from '../../src/index';
import { text, color, number } from '@storybook/addon-knobs';
jest.mock('@storybook/addon-actions');
jest.mock('@storybook/addon-knobs');

describe('correctly knobifies object', () => {
  it('with colors', () => {
    const theObject = {
      aString: 'aString',
      aColor: '#FFFFFF',
    };
    const knobbedObject = fromExamples([
      {
        aString: '#fff',
        color: '#fff',
      },
      {
        aString: 'e',
        color: 'rgb(255,255,255)',
      },
    ]).knobified(theObject);
    expect(knobbedObject).toEqual({
      aString: text(theObject.aString),
      aColor: color(theObject.aColor),
    });
  });
  it('with single example', () => {
    const theObject = {
      number: 5,
    };
    const knobbedObject = fromExamples({
      number: 1,
    }).knobified(theObject);
    expect(knobbedObject).toEqual({
      number: number(theObject.number),
    });
  });
});
