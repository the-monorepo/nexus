"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.nullCounts = nullCounts;
exports.undefinedCounts = undefinedCounts;
exports.allAreIntegers = allAreIntegers;

function nullCounts(values) {
  return values.filter(value => value === null).length;
}

function undefinedCounts(values) {
  return values.filter(value => value === undefined).length;
}

function allAreIntegers(values) {
  for (const value of values) {
    if (!Number.isInteger(value)) {
      return false;
    }
  }

  return true;
}
//# sourceMappingURL=util.js.map
