'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.runTypeTests = runTypeTests;

var _util = require('./util');

function runTypeTests(values, typeTests) {
  const undefinedCount = (0, _util.undefinedCounts)(values);
  const nullCount = (0, _util.nullCounts)(values);
  const passedTests = [];

  for (const typeTest of typeTests) {
    for (const value of values) {
      if (typeTest.typeCheck(value)) {
        passedTests.push(typeTest);
        break;
      }
    }
  }

  return {
    nullCount,
    undefinedCount,
    typeValues: passedTests.map(({ value }) => value),
  };
}
