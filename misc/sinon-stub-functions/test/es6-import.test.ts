import rewiremock from 'rewiremock';

import { stubFunctions } from '../src';
import * as es6 from './es6-module';
import * as commonjs from './exports-module';
rewiremock('./exports-module').with(
  stubFunctions(rewiremock.requireActual('./exports-module')),
);
rewiremock('./es6-module').with(stubFunctions(rewiremock.requireActual('./es6-module')));

describe('esm imports', () => {
  it('exports mocked modules work', () => {
    expect(commonjs.someFunction()).toBeUndefined();
  });

  it('mocked modules work', () => {
    expect(es6.someFunction()).toBeUndefined();
  });
});
