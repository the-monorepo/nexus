import { runSingularTypeTests, typeTest } from '../src/index';
function testResult(values, typeTests, expectedResult) {
  it('correct result', () => {
    const result = runSingularTypeTests(values, typeTests);

    expect(result.undefinedCount).toBe(expectedResult.undefinedCount);
    expect(result.nullCount).toBe(expectedResult.nullCount);
    expect(result.typeTest).toBe(expectedResult.typeTest);
  });
}
describe('run-single-type', () => {
  it('type check called', () => {
    const check = jest.fn();
    runSingularTypeTests([1], [typeTest(check, undefined)]);
    expect(check.mock.calls.length).toBe(1);
  });
  describe('1 type', () => {
    const int = typeTest(value => Number.isInteger(value), undefined);
    testResult([1, 2, 3], [int], {
      undefinedCount: 0,
      nullCount: 0,
      typeTest: int,
    });
  });
});
