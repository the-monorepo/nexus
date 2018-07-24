import { nullCounts, undefinedCounts } from '../src/index';
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
