"use strict";

import chalk from 'chalk';
import { extractTypeInfo } from '@byexample/types';
import { findModule } from '../findModule';
export function defaultModuleAction(moduleName) {
  var result = findModule(moduleName);
  console.log("Using module '".concat(chalk.cyan(result.name), "'"));
  var stdin = process.openStdin();
  stdin.on('data', input => {
    var output = undefined;

    if (result.module.fromInput) {
      output = result.module.fromInput(input);
    } else if (result.module.fromTypes) {
      var inputJson = JSON.parse(input);
      var typeInfo = extractTypeInfo(inputJson);
      output = result.module.fromTypes(typeInfo);
    } else {
      throw new Error("".concat(result.name, " does not provide fromTypes or fromExamples"));
    }

    process.stdout.write(JSON.stringify(output, undefined, 2));
  });
}
//# sourceMappingURL=defaultModuleAction.js.map
