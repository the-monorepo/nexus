import { TestInputs } from './test-inputs';
import { generateCssColorFunctionInputs, ParameterFormat } from './css-color-function-inputs';
import cssColors from 'css-color-names';
function testInputs(valid: any[], invalid: any[]): TestInputs {
  return {
    valid: new Set(valid),
    invalid: new Set(invalid)
  }
}

const rgbFormat: ParameterFormat = {
  min: {
    value: 0,
    inclusive: true
  },
  max: {
    value: 255,
    inclusive: true
  },
  percentages: false
};

const degreesFormat: ParameterFormat = {
  min: {
    value: 0,
    inclusive: true
  },
  max: {
    value: 360,
    inclusive: true
  },
  percentages: false
}

const alphaFormat: ParameterFormat = {
  min: {
    value: 0,
    inclusive: true
  },
  max: {
    value: 1,
    inclusive: true
  },
  percentages: false
};

const standardPercentage: ParameterFormat = {
  min: {
    value: 0,
    inclusive: true
  },
  max: {
    value: 100,
    inclusive: true
  },
  percentages: true 
};

export const inputs: { 
  [key: string]: TestInputs
} = {
  rgb: generateCssColorFunctionInputs('rgb', rgbFormat, rgbFormat, rgbFormat),
  hex: testInputs(
    [
      "#fff",
      "#FFF",
      "#FFFFFF",
      "#FFFFFFFF",
      "#000",
      "#000000",
      "#00000000"
    ], [
      "#f",
      "#F",
      "#FF",
      "#FFFF",
      "#FFFFF",
      "#0000000",
      "#0",
      "#00",
      "#0000",
      "#00000",
      "#0000000",
      "#GGG",
      "#GGGGGG",
      "F",
      "G",
      "0",
      " #FFFFFF",
      "#FFFFFF "
    ]
  ),
  rgba: generateCssColorFunctionInputs(
    'rgba',
    rgbFormat,
    rgbFormat,
    rgbFormat,
    alphaFormat
  ),
  hsl: generateCssColorFunctionInputs(
    'hsl',
    degreesFormat,
    standardPercentage,
    standardPercentage
  ),
  hsla: generateCssColorFunctionInputs(
    'hsla',
    degreesFormat,
    standardPercentage,
    standardPercentage,
    alphaFormat
  ),
  named: testInputs(Object.keys(cssColors), [])
} 