import * as jest from 'jest-mock';

import { typeTest } from '../../src/TypeTest.ts';
import { runTypeTests } from '../../src/runTypeTests.ts';
function testResult(values, checks, expectedResult) {
  it('correct result', () => {
    const expectedValues: any[] = [];
    checks
      .filter((check) => expectedResult.checks.includes(check))
      .forEach((check, i) => {
        expectedValues.push(i);
      });
    const typeTests = checks.map((check, i) => typeTest(check, i));
    const result = runTypeTests(values, typeTests);
    expect(result.undefinedCount).toBe(expectedResult.undefinedCount);
    expect(result.nullCount).toBe(expectedResult.nullCount);
    expect(result.values.length).toBe(expectedValues.length);
    expectedValues.forEach((value) => expect(result.values.includes(value)).toBe(true));
  });
}
describe('run-single-type', () => {
  it('No checks', () => {
    runTypeTests([1, '', undefined], []);
  });
  it('No values', () => {
    runTypeTests([], [typeTest(jest.fn(), undefined), typeTest(jest.fn(), undefined)]);
  });
  describe('type check called', () => {
    it('1 check', () => {
      const check = jest.fn();
      runTypeTests([1], [typeTest(check, undefined)]);
      expect(check.mock.calls.length).toBe(1);
    });
  });
  describe('1 type', () => {
    const int = jest.fn().mockReturnValue(true);
    testResult([1, 2, 3], [int], {
      undefinedCount: 0,
      nullCount: 0,
      checks: [int],
    });
  });
});
