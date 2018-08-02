import { createArgParser } from './createArgParser';

export function run() {
  const parser = createArgParser();
  const test = parser.parse(process.argv);
  console.log(test);
}
