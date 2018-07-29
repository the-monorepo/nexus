'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.run = run;

var _createArgParser = require('./createArgParser');

function run() {
  const parser = (0, _createArgParser.createArgParser)();
  parser.parse(process.argv);
  console.log(parser);
}
