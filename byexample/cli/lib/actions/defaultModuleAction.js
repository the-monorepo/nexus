"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultModuleAction = defaultModuleAction;

var _chalk = _interopRequireDefault(require("chalk"));

var _types = require("@byexample/types");

var _findModule = require("../findModule");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function defaultModuleAction(moduleName) {
  const result = (0, _findModule.findModule)(moduleName);
  console.log(`Using module '${_chalk.default.cyan(result.name)}'`);
  const stdin = process.openStdin();
  stdin.on('data', input => {
    let output = undefined;

    if (result.module.fromInput) {
      output = result.module.fromInput(input);
    } else if (result.module.fromTypes) {
      const inputJson = JSON.parse(input);
      const typeInfo = (0, _types.extractTypeInfo)(inputJson);
      output = result.module.fromTypes(typeInfo);
    } else {
      throw new Error(`${result.name} does not provide fromTypes or fromExamples`);
    }

    process.stdout.write(JSON.stringify(output, undefined, 2));
  });
}
//# sourceMappingURL=defaultModuleAction.js.map
