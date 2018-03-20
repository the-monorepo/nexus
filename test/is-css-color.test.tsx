import { testColorTypeFunction } from './helpers/test-function';
import { expandInputs } from './inputs/expand';
import { TestInputs } from './inputs/test-inputs';
import { inputs } from './inputs/suites';
import { isCssColor } from 'src/index';
testColorTypeFunction(
  'Css color',
  isCssColor,
  ...Object.keys(inputs).map(key => [key, inputs[key], key])
);
