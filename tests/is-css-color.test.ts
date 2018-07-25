import { testColorTypeFunction } from './helpers/test-function';
import { inputs } from './inputs/suites';
import { isCssColor } from '../src/index';
testColorTypeFunction(
  'Css color',
  isCssColor,
  ...Object.keys(inputs).map(key => [key, inputs[key], key]),
);
