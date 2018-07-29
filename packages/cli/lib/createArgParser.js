'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.createArgParser = createArgParser;

var _commander = _interopRequireDefault(require('commander'));

var _package = _interopRequireDefault(require('../package.json'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function createArgParser() {
  return _commander.default.version(_package.default.version);
}
