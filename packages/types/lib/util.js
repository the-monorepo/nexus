'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.nullCounts = nullCounts;
exports.undefinedCounts = undefinedCounts;

function nullCounts(values) {
  return values.filter(value => value === null).length;
}

function undefinedCounts(values) {
  return values.filter(value => value === undefined).length;
}
