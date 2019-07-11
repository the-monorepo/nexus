import { AssertionError } from '@fault/mocha-assertion-error';
import StackTrace from 'stacktrace-js'; 
import { GENERIC } from '@fault/addon-message-types/src/assertion-types';
const plugin = (chai, util) => {
  const AssertionPrototype = chai.Assertion.prototype;
  const originalAssert = AssertionPrototype.assert;
  AssertionPrototype.assert = function recordAssert(...params) {
    try {
      return originalAssert.call(this, ...params);
    } catch(err) {
      const stackFrames = StackTrace.getSync();
      throw new AssertionError({
        assertionType: GENERIC,
        actual: err.actual,
        expected: err.expected,
        message: err.message,
        stackFrames
      });
    }
  }
};
export default plugin;
