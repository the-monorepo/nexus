import { nullCounts, undefinedCounts, allAreIntegers } from '../../src/util.ts';
function test(values, nullCount, undefinedCount) {
  it(`${values}`, () => {
    expect(nullCounts(values)).toBe(nullCount);
    expect(undefinedCounts(values)).toBe(undefinedCount);
  });
}
/**
 * Checking to see if null and undefined counting is working properly
 */
describe('null-undefined-counts', () => {
  test([], 0, 0);
  test([undefined], 0, 1);
  test([null], 1, 0);
  test([undefined, null], 1, 1);
  test([''], 0, 0);
  test(['', 0, 1, () => {}, 'null', 'undefined', class {}, undefined, null], 1, 1);
});

describe('allAreIntegers', () => {
  describe('valid', () => {
    it('integers', () => {
      expect(
        allAreIntegers([Number.MIN_SAFE_INTEGER, -1, 0, 1, Number.MAX_SAFE_INTEGER]),
      ).toBe(true);
    });
  });
  describe('invalid', () => {
    it('numbers', () => {
      expect(allAreIntegers([1, 2, 3, 1.01])).toBe(false);
    });
    it('integers + undefined values', () => {
      expect(allAreIntegers([1, undefined])).toBe(false);
    });
    it('integers + null values', () => {
      expect(allAreIntegers([-1, null])).toBe(false);
    });
  });
});
