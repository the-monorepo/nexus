import program from 'commander';
import packageJson from '../package.json';

export function createArgParser() {
  return program.version(packageJson.version);
}
