import { mockFunctions } from 'jest-mock-functions';
const actualModule = require.requireActual('@storybook/addon-knobs');
const mockedModule = mockFunctions(actualModule, {
  onMockedFunction: jestFn => jestFn.mockImplementation(val => val),
});
module.exports = mockedModule;
