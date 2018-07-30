import { createArgParser } from '../src/createArgParser';

describe('Arg parser', () => {
  let parser = createArgParser();
  function testPasses(argv) {
    parser.parse(argv);
  }
  function testThrows(argv) {
    expect(() => parser.parse(argv)).toThrowError();
  }
  testPasses(['', 'openapi']);
  testThrows(['', 'openapi', '']);
});
