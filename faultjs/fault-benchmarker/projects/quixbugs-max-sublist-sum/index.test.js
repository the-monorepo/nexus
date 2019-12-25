import { maxSublistSum } from './index';
import expect from 'expect';

describe('gcd', () => {
  it('', () => expect(maxSublistSum([4, -5, 2, 1, -1, 3])).toBe(5));
  it('', () => expect(maxSublistSum([0, -1, 2, -1, 3, -1, 0])).toBe(4));
  it('', () => expect(maxSublistSum([3, 4, 5])).toBe(12));
  it('', () => expect(maxSublistSum([4, -2, -8, 5, -2, 7, 7, 2, -6, 5])).toBe(19));
  it('', () => expect(maxSublistSum([-4, -4, -5])).toBe(0));
  it('', () => expect(maxSublistSum([-2, 1, -3, 4, -1, 2, 1, -5, 4])).toBe(6));
});
