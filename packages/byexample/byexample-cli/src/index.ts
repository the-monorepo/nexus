import { createArgParser } from './createArgParser.ts';

export function run() {
  createArgParser().parse(process.argv);
}

run();
