'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _mochaAssertionError = require('@fault/mocha-assertion-error');

var _stacktraceJs = _interopRequireDefault(require('stacktrace-js'));

var _types = require('@fault/types');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const plugin = (chai, util) => {
  const AssertionPrototype = chai.Assertion.prototype;
  const originalAssert = AssertionPrototype.assert;

  AssertionPrototype.assert = function recordAssert(...params) {
    try {
      return originalAssert.call(this, ...params);
    } catch (err) {
      const stackFrames = _stacktraceJs.default.getSync();

      throw new _mochaAssertionError.AssertionError({
        assertionType: _types.Assertion.GENERIC,
        actual: err.actual,
        expected: err.expected,
        stackFrames,
        stack: err.stack,
        message: err.message,
      });
    }
  };
};

var _default = plugin;
exports.default = _default;
//# sourceMappingURL=index.js.map
