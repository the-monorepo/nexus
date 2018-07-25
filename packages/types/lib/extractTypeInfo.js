'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.extractTypeInfo = extractTypeInfo;

var _defaultTypeTests = require('./defaultTypeTests');

var _runTypeTests = require('./runTypeTests');

function extractTypeInfo(values) {
  const { nullCount, undefinedCount, typeValues } = (0, _runTypeTests.runTypeTests)(
    values,
    (0, _defaultTypeTests.defaultTypeTests)(values, extractTypeInfo),
  );
  const types = typeValues.map(callback => callback());
  return {
    nullCount,
    undefinedCount,
    types,
  };
}
