import rewiremock from 'rewiremock';
import { stubFunctions } from '../src';

describe('require', () => {
  it('exports mocked modules work', () => {
    rewiremock('./exports-module').with(stubFunctions(rewiremock.requireActual('./exports-module')));
    const mockedModule = require('./exports-module');
    console.log(mockedModule.someFunction());
    expect(mockedModule.someFunction()).to.be.undefined;
  });

  it('mocked modules work', () => {
    rewiremock('./es6-module').with(stubFunctions(rewiremock.requireActual('./es6-module')));
    const mockedModule = require('./es6-module');
    expect(mockedModule.someFunction()).to.be.undefined;
  });
});
