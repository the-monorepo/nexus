import chalk from 'chalk';

import { extractTypeInfo } from '@by-example/types';

import { findModule } from '../findModule';

export function defaultModuleAction(moduleName: string) {
  const result = findModule(moduleName);

  console.log(`Using module '${chalk.cyan(result.name)}'`);

  const stdin = process.openStdin();
  stdin.on('data', input => {
    let output = undefined;
    if (result.module.fromInput) {
      output = result.module.fromInput(input);
    } else if (result.module.fromTypes) {
      const inputJson = JSON.parse(input);
      const typeInfo = extractTypeInfo(inputJson);
      output = result.module.fromTypes(typeInfo);
    } else {
      throw new Error(`${result.name} does not provide fromTypes or fromExamples`);
    }
    process.stdout.write(JSON.stringify(output, undefined, 2));
  });
}
