'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.typeTest = typeTest;

/**
 * Just a helper method for easy construction of a type test
 */
function typeTest(typeCheck, value) {
  return {
    typeCheck,
    value,
  };
}
