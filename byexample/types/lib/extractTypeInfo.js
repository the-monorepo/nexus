"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractTypeInfo = extractTypeInfo;

var _defaultTypeTests = require("./defaultTypeTests");

var _runTypeTests = require("./runTypeTests");

function extractTypeInfo(examples, typeTests = (0, _defaultTypeTests.defaultTypeTests)(extractTypeInfo)) {
  const arrayOfExamples = Array.isArray(examples) ? examples : [examples];
  const {
    nullCount,
    undefinedCount,
    values
  } = (0, _runTypeTests.runTypeTests)(arrayOfExamples, typeTests);
  return {
    nullCount,
    undefinedCount,
    types: values.map(value => value(examples))
  };
}
//# sourceMappingURL=extractTypeInfo.js.map
