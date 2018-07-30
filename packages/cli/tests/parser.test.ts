import { createArgParser } from '../src/createArgParser';
function testName(argv) {
  return `['${argv.join("', '")}']`;
}

describe('Arg parser', () => {
  let parser = createArgParser();
  function testPasses(argv) {
    it(testName(argv), () => {
      parser.parse(argv);
    });
  }
  function testThrows(argv) {
    it(testName(argv), () => {
      expect(() => parser.parse(argv)).toThrowError();
    });
  }
  testPasses(['', 'openapi']);
  //testThrows(['', 'openapi', '']);
});
