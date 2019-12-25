import rewiremock from 'rewiremock';
import { stubFunctions } from '../src';
describe('require', () => {
  it('exports mocked modules work', () => {
    rewiremock.enable();
    rewiremock('./exports-module').with(
      stubFunctions(rewiremock.requireActual('./exports-module')),
    );
    const mockedModule = require('./exports-module');
    rewiremock.disable();

    expect(mockedModule.someFunction()).toBeUndefined();
  });

  it('mocked modules work', () => {
    rewiremock.enable();
    rewiremock('./es6-module').with(
      stubFunctions(rewiremock.requireActual('./es6-module')),
    );
    const mockedModule = require('./es6-module');
    rewiremock.disable();

    expect(mockedModule.someFunction()).toBeUndefined();
  });
});
