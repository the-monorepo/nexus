import cssColorFormat from '../src/index.ts';
import { testColorTypeFunction } from './helpers/test-function.ts';
import { inputs } from './inputs/suites.ts';
import { TestInputs } from './inputs/test-inputs.ts';
testColorTypeFunction(
  'Css color',
  cssColorFormat,
  ...Object.keys(inputs).map(
    (key) => [key, inputs[key], key] as [string, TestInputs, string],
  ),
);
