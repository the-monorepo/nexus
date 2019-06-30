import mock from 'rewiremock';
mock.enable();
mock('./exports-module').with(stubFunctions(mock.requireActual('./exports-module')));
mock('./es6-module').with(stubFunctions(mock.requireActual('./es6-module')));
import { stubFunctions } from '../src';
import * as es6 from './es6-module';
import * as commonjs from './exports-module';
mock('./exports-module').with(stubFunctions(mock.requireActual('./exports-module')));
mock('./es6-module').with(stubFunctions(mock.requireActual('./es6-module')));

describe('require', () => {
  it('exports mocked modules work', () => {
    mock.enable();
    mock('./exports-module').with(stubFunctions(mock.requireActual('./exports-module')));
    expect(commonjs.someFunction()).to.be.undefined;
  });

  it('mocked modules work', () => {
    mock.enable();
    mock('./es6-module').with(stubFunctions(mock.requireActual('./es6-module')));
    expect(es6.someFunction()).to.be.undefined;
  });
});
