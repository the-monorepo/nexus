"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runTypeTests = runTypeTests;

var _util = require("./util");

function runTypeTests(values, typeTests) {
  const undefinedCount = (0, _util.undefinedCounts)(values);
  const nullCount = (0, _util.nullCounts)(values);
  const passedTests = Object.keys(typeTests).map(key => typeTests[key]).filter(typeTest => {
    for (const value of values) {
      if (typeTest.typeCheck(value)) {
        return true;
      }
    }

    return false;
  });
  return {
    nullCount,
    undefinedCount,
    values: passedTests.map(({
      value
    }) => value)
  };
}
//# sourceMappingURL=runTypeTests.js.map
