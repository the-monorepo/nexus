import program from 'commander';

import { extractTypeInfo } from '@by-example/types';

import packageJson from '../package.json';

export function createArgParser() {
  const name = 'by-example';
  return program
    .version(packageJson.version)
    .name(name)
    .command('test')
    .action(() => console.log('test'))
    .command(`use <conversion-module> generrate`)
    .action(moduleName => {
      console.log('test');
      const prefixes = ['@by-example/', 'by-example-', ''];
      const compiledModuleNames = prefixes.map(prefix => prefix + moduleName);
      let aModule = undefined;
      let finalModuleName = undefined;
      let i = 0;
      while (!aModule && i < compiledModuleNames.length) {
        finalModuleName = compiledModuleNames[i];
        aModule = require(finalModuleName);
        i++;
      }
      console.info(`Using ${finalModuleName}...`);
      if (!aModule) {
        throw new Error(
          `Could not find module using any of the following: ${compiledModuleNames.join(
            ', ',
          )}`,
        );
      }
      const input: string = process.stdin.read() as string;
      let output = undefined;
      if (aModule.fromExamples) {
        output = aModule.fromExamples(input);
      } else if (aModule.fromTypes) {
        const inputJson = JSON.parse(input);
        const typeInfo = extractTypeInfo(inputJson);
        output = aModule.fromTypes(typeInfo);
      } else {
        throw new Error(`${finalModuleName} does not provide fromTypes or fromExamples`);
      }
      process.stdout.write(JSON.stringify(output, undefined, 2));
    })
    .parse(process.argv);
}
