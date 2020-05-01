"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createArgParser = createArgParser;

var _commander = require("commander");

var _defaultModuleAction = require("./actions/defaultModuleAction");

var _package = _interopRequireDefault(require("../package"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createArgParser() {
  const name = 'byexample';
  const rootCommand = new _commander.Command();
  rootCommand.version(_package.default.version).name(name);
  rootCommand.arguments(`<conversion-module>`).action(_defaultModuleAction.defaultModuleAction);
  return rootCommand;
}
//# sourceMappingURL=createArgParser.js.map
