import { defaultCompareFn } from '../src/index.ts';
it(defaultCompareFn.name, () => {
  expect(defaultCompareFn(0, 0)).toBe(0);
  expect(defaultCompareFn('0', 0)).toBe(0);
  expect(defaultCompareFn(0, '0')).toBe(0);
  expect(defaultCompareFn(0, true)).toBeLessThanOrEqual(-1);
  expect(defaultCompareFn(false, 0)).toBeGreaterThanOrEqual(-1);
  expect(defaultCompareFn(1, 0)).toBe(1);
  expect(defaultCompareFn(0, 1)).toBe(-1);
  expect(defaultCompareFn(100, 1)).toBeGreaterThanOrEqual(1);
  expect(defaultCompareFn(100, 2)).toBeLessThanOrEqual(-1);
  expect(defaultCompareFn('aab', 'aac')).toBeLessThanOrEqual(-1);
});
