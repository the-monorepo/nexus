import mockFunctions from '../lib';

jest.mock('./es6-module', () => {
  const actualModule = require.requireActual('./es6-module');
  return mockFunctions(actualModule);
});

jest.mock('./exports-module', () => {
  const actualModule = require.requireActual('./exports-module');
  return mockFunctions(actualModule);
});

describe('require', () => {
  it('exports mocked modules work', () => {
    const mockedModule = require('./exports-module');
    expect(mockedModule.someFunction()).toBeUndefined();
  });

  it('mocked modules work', () => {
    const mockedModule = require('./es6-module');
    expect(mockedModule.someFunction()).toBeUndefined();
  });
});
