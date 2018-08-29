import { createArgParser } from './createArgParser';

export function run() {
  createArgParser().parse(process.argv);
}
