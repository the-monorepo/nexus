import { mockFunctions } from 'jest-mock-functions';
import { logger, overrideConsoleLogger } from '../../src';
import { testCases } from '../util/testCases';

const mockLogger: any = mockFunctions(logger(), { recursive: true });
// Logging methods that console and logger share in common
const loggingMethods = ['error', 'debug', 'info', 'warn'];

/**
 * Checks which logging methods in the custom logger were actually called
 */
function testLoggerCallCounts(callCounts) {
  Object.keys(mockLogger.levels).forEach(level => {
    const callCount = callCounts[level] ? callCounts[level] : 0;
    expect(mockLogger[level].mock.calls.length).toBe(callCount);
  });
}

/**
 * Will test if logging something through console.xxx will, in turn,
 * call the custom logger logging methods if you use overrideConsoleLogger
 */
function testConsoleInput(...input) {
  const stringifiedInput = input.map(i => JSON.stringify(i)).join();
  describe(`input = [${stringifiedInput}]`, () => {
    it(`logging to console.log`, () => {
      overrideConsoleLogger(mockLogger);
      // eslint-disable-next-line no-console
      console.log(...input);
      testLoggerCallCounts({ verbose: 1 });
    });
    loggingMethods.forEach(loggingMethodName => {
      it(`logging to console.${loggingMethodName}}`, () => {
        overrideConsoleLogger(mockLogger);
        console[loggingMethodName](...input);
        testLoggerCallCounts({ [loggingMethodName]: 1 });
      });
    });
  });
}
// TODO: Might be nice if we test the actual stuff that ends up being logged too
describe('console logs to custom logger', () => {
  for (const testCase of testCases) {
    testConsoleInput(testCase.input);
  }
});
