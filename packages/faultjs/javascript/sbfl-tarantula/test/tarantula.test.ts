import tarantula from '../src/index.ts';
describe('tarantula', () => {
  it('0 faults', () => {
    expect(tarantula({ passed: 0, failed: 0 }, { passed: 10, failed: 111 })).toBe(
      Number.NEGATIVE_INFINITY,
    );
  });
});
