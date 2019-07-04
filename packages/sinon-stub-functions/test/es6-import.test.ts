import { stubFunctions } from '../src';
import rewiremock from 'rewiremock';
import * as es6 from './es6-module';
import * as commonjs from './exports-module';
console.log('run');
rewiremock('./exports-module').with(
  stubFunctions(rewiremock.requireActual('./exports-module')),
);
rewiremock('./es6-module').with(stubFunctions(rewiremock.requireActual('./es6-module')));

describe('esm imports', () => {
  it('exports mocked modules work', () => {
    expect(commonjs.someFunction()).to.be.equal(1);
  });

  it('mocked modules work', () => {
    expect(es6.someFunction()).to.be.undefined;
  });
});
