import { Command } from 'commander';

import packageJson from '../package.json';
import { defaultModuleAction } from './actions/defaultModuleAction.ts';

export function createArgParser() {
  const name = 'byexample';
  const rootCommand = new Command();
  rootCommand.version(packageJson.version).name(name);

  rootCommand.arguments(`<conversion-module>`).action(defaultModuleAction);

  return rootCommand;
}
