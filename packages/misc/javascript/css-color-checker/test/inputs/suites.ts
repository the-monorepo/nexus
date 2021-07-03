import * as cssColors from 'named-css-colors';

import {
  generateCssColorFunctionInputs,
  ParameterFormat,
} from './css-color-function-inputs.ts';
import { TestInputs } from './test-inputs.ts';
function testInputs(valid: any[], invalid: any[]): TestInputs {
  return {
    valid: new Set(valid),
    invalid: new Set(invalid),
  };
}

const rgbFormat: ParameterFormat = {
  noLetters: true,
  min: {
    value: 0,
    inclusive: true,
  },
  max: {
    value: 255,
    inclusive: true,
  },
  percentages: false,
};

const degreesFormat: ParameterFormat = {
  noLetters: true,
  min: {
    value: 0,
    inclusive: true,
  },
  max: {
    value: 360,
    inclusive: true,
  },
  percentages: false,
};

const alphaFormat: ParameterFormat = {
  noLetters: true,
  min: {
    value: 0,
    inclusive: true,
  },
  max: {
    value: 1,
    inclusive: true,
  },
  percentages: false,
};

const standardPercentage: ParameterFormat = {
  noLetters: true,
  min: {
    value: 0,
    inclusive: true,
  },
  max: {
    value: 100,
    inclusive: true,
  },
  percentages: true,
};
// TODO: Use Automatic generation
const hwb: TestInputs = testInputs(
  [
    'hwb(0,0%,0%)',
    'hwb(0,100%,0%)',
    'hwb(0,50%,50%)',
    'hwb(0,0%,100%)',
    'hwb(360,0%,0%)',
    'hwb(359.99,99.99%,0.01%)',
  ],
  [
    'hwb(e,0%,0%)',
    'hwb(0,e%,0%)',
    'hwb(0,101%,0%)',
    'hwb(-1,0%,0%)',
    'hwb(0,0%,101%)',
    'hwb(0,51%,50%)',
    'hwb(361,0%,0%)',
  ],
);

export const inputs: {
  [key: string]: TestInputs;
} = {
  rgb: generateCssColorFunctionInputs('rgb', rgbFormat, rgbFormat, rgbFormat),
  hex: testInputs(
    ['#fff', '#FFF', '#FFFFFF', '#FFFFFFFF', '#000', '#000000', '#00000000'],
    [
      '#f',
      '#F',
      '#FF',
      '#FFFF',
      '#FFFFF',
      '#0000000',
      '#0',
      '#00',
      '#0000',
      '#00000',
      '#0000000',
      '#GGG',
      '#GGGGGG',
      'F',
      'G',
      '0',
      ' #FFFFFF',
      '#FFFFFF ',
    ],
  ),
  rgba: generateCssColorFunctionInputs(
    'rgba',
    rgbFormat,
    rgbFormat,
    rgbFormat,
    alphaFormat,
  ),
  hsl: generateCssColorFunctionInputs(
    'hsl',
    degreesFormat,
    standardPercentage,
    standardPercentage,
  ),
  hsla: generateCssColorFunctionInputs(
    'hsla',
    degreesFormat,
    standardPercentage,
    standardPercentage,
    alphaFormat,
  ),
  hwb,
  named: testInputs(Object.keys(cssColors), ['reddd', '']),
};
