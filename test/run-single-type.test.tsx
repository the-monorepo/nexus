import { runSingularTypeTests, typeTest } from 'src/index';
describe('run-single-type', () => {
  it('type check called', () => {
    const check = jest.fn();
    runSingularTypeTests(
      [1], [
        typeTest(
          check,
          undefined
        )
      ]
    );
    expect(check.mock.calls.length).toBe(1);
  })
  it('1 type', () => {
    const int = typeTest(
      (value) => Number.isInteger(value),
      undefined
    );
    const result = runSingularTypeTests(
      [1, 2, 3], [
        int
      ]
    );
    expect(result.undefinedCount).toBe(0);
    expect(result.nullCount).toBe(0);
    expect(result.typeTest).toBe(int);
  });
});