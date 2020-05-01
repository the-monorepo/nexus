"use strict";

import { nullCounts, undefinedCounts } from './util';
export function runTypeTests(values, typeTests) {
  var undefinedCount = undefinedCounts(values);
  var nullCount = nullCounts(values);
  var passedTests = Object.keys(typeTests).map(key => typeTests[key]).filter(typeTest => {
    for (var value of values) {
      if (typeTest.typeCheck(value)) {
        return true;
      }
    }

    return false;
  });
  return {
    nullCount,
    undefinedCount,
    values: passedTests.map((_ref) => {
      var {
        value
      } = _ref;
      return value;
    })
  };
}
//# sourceMappingURL=runTypeTests.js.map
