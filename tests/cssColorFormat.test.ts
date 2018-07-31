import { testColorTypeFunction } from './helpers/test-function';
import { inputs } from './inputs/suites';
import { cssColorFormat } from '../src/index';
testColorTypeFunction(
  'Css color',
  cssColorFormat,
  ...Object.keys(inputs).map(key => [key, inputs[key], key]),
);
