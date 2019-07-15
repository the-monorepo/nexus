import { AssertionError } from '@fault/mocha-assertion-error';
import StackTrace from 'stacktrace-js'; 
import { Assertion } from '@fault/types';
const plugin = (chai, util) => {
  const AssertionPrototype = chai.Assertion.prototype;
  const originalAssert = AssertionPrototype.assert;
  AssertionPrototype.assert = function recordAssert(...params) {
    try {
      return originalAssert.call(this, ...params);
    } catch(err) {
      const stackFrames = StackTrace.getSync();
      throw new AssertionError({
        assertionType: Assertion.GENERIC,
        actual: err.actual,
        expected: err.expected,
        stackFrames,
        stack: err.stack,
        message: err.message,
      });
    }
  }
};
export default plugin;
