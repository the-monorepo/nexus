import mock from 'rewiremock';
import { stubFunctions } from '../src';

describe('require', () => {
  it('exports mocked modules work', () => {
    mock('./exports-module').with(stubFunctions(mock.requireActual('./exports-module')));
    const mockedModule = require('./exports-module');
    console.log(mockedModule.someFunction());
    expect(mockedModule.someFunction()).to.be.undefined;
  });

  it('mocked modules work', () => {
    mock('./es6-module').with(stubFunctions(mock.requireActual('./es6-module')));
    const mockedModule = require('./es6-module');
    expect(mockedModule.someFunction()).to.be.undefined;
  });
});
