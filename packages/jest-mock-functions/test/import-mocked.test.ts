import { mockFunctions } from '../lib';
import { someFunction as exportsSomeFunction } from './exports-module';
import exportsModule from './exports-module';
import { someFunction as es6SomeFunction } from './es6-module';

jest.mock('./es6-module', () => {
  const actualModule = require.requireActual('./es6-module');
  return mockFunctions(actualModule);
});

jest.mock('./exports-module', () => {
  const actualModule = require.requireActual('./exports-module');
  return mockFunctions(actualModule);
});

describe('import', () => {
  it('mocked es6 modules work', () => {
    expect(es6SomeFunction()).toBeUndefined();
  });

  it('exports default import', () => {
    expect(exportsModule.someFunction()).toBeUndefined();
  });

  it('mocked exports modules work', () => {
    expect(exportsSomeFunction()).toBeUndefined();
  });
});
