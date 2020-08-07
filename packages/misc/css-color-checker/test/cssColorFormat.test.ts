import cssColorFormat from '../src/index';
import { testColorTypeFunction } from './helpers/test-function';
import { inputs } from './inputs/suites';
import { TestInputs } from './inputs/test-inputs';
testColorTypeFunction(
  'Css color',
  cssColorFormat,
  ...Object.keys(inputs).map(
    (key) => [key, inputs[key], key] as [string, TestInputs, string],
  ),
);
