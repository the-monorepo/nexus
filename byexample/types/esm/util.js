"use strict";

export function nullCounts(values) {
  return values.filter(value => value === null).length;
}
export function undefinedCounts(values) {
  return values.filter(value => value === undefined).length;
}
export function allAreIntegers(values) {
  for (var value of values) {
    if (!Number.isInteger(value)) {
      return false;
    }
  }

  return true;
}
//# sourceMappingURL=util.js.map
