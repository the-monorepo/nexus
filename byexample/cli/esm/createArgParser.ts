import { Command } from 'commander';

import { defaultModuleAction } from './actions/defaultModuleAction';

import packageJson from '../package';

export function createArgParser() {
  const name = 'byexample';
  const rootCommand = new Command();
  rootCommand.version(packageJson.version).name(name);

  rootCommand.arguments(`<conversion-module>`).action(defaultModuleAction);

  return rootCommand;
}
