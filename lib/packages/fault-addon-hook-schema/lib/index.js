'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.schema = void 0;

var _hookSchema = require('hook-schema');

const beforeAfterHookSchema = {};
const onHookSchema = {
  complete: null,
  fileFinished: null,
  testResult: null,
  allFilesFinished: [
    null,
    {
      yield: true,
    },
  ],
};
const schema = (0, _hookSchema.fromSchema)(beforeAfterHookSchema, onHookSchema);
exports.schema = schema;
//# sourceMappingURL=index.js.map
