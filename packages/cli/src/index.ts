import packageJson from '../package.json';
import { createArgParser } from './createArgParser';

export function run() {
  const parser = createArgParser();
  parser.parse(process.argv);
}
