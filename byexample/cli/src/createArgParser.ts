import { Command } from 'commander';

import packageJson from '../package';
import { defaultModuleAction } from './actions/defaultModuleAction';

export function createArgParser() {
  const name = 'byexample';
  const rootCommand = new Command();
  rootCommand.version(packageJson.version).name(name);

  rootCommand.arguments(`<conversion-module>`).action(defaultModuleAction);

  return rootCommand;
}
