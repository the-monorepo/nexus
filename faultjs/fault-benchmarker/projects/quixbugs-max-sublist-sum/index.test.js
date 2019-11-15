import { maxSublistSum } from './index';
import { expect } from 'chai';

describe('gcd', () => {
  it('', () => expect(maxSublistSum([4, -5, 2, 1, -1, 3])).to.equal(5));
  it('', () => expect(maxSublistSum([0, -1, 2, -1, 3, -1, 0])).to.equal(4));
  it('', () => expect(maxSublistSum([3, 4, 5])).to.equal(12));
  it('', () => expect(maxSublistSum([4, -2, -8, 5, -2, 7, 7, 2, -6, 5])).to.equal(19));
  it('', () => expect(maxSublistSum([-4, -4, -5])).to.equal(0));
  it('', () => expect(maxSublistSum([-2, 1, -3, 4, -1, 2, 1, -5, 4])).to.equal(6));
});
