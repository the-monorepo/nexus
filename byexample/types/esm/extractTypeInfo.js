"use strict";

import { defaultTypeTests } from './defaultTypeTests';
import { runTypeTests } from './runTypeTests';
export function extractTypeInfo(examples) {
  var typeTests = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultTypeTests(extractTypeInfo);
  var arrayOfExamples = Array.isArray(examples) ? examples : [examples];
  var {
    nullCount,
    undefinedCount,
    values
  } = runTypeTests(arrayOfExamples, typeTests);
  return {
    nullCount,
    undefinedCount,
    types: values.map(value => value(examples))
  };
}
//# sourceMappingURL=extractTypeInfo.js.map
