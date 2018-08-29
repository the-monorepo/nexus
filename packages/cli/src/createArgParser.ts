import { Command } from 'commander';

import { defaultModuleAction } from './actions/defaultModuleAction';

import packageJson from '../package';

export function createArgParser() {
  const name = 'by-example';
  const rootCommand = new Command();
  rootCommand.version(packageJson.version).name(name);

  rootCommand.arguments(`<conversion-module>`).action(defaultModuleAction);

  return rootCommand;
}
