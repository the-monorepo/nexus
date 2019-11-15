import { findInSorted } from './index';
import { expect } from 'chai';

describe('findInSorted', () => {
  it('1', () => expect(findInSorted([3, 4, 5, 5, 5, 5, 6], 5)).to.equal(3));
  it('2', () => expect(findInSorted([1, 2, 3, 4, 6, 7, 8], 5)).to.equal(-1));
  it('3', () => expect(findInSorted([1, 2, 3, 4, 6, 7, 8], 4)).to.equal(3));
  it('4', () => expect(findInSorted([2, 4, 6, 8, 10, 12, 14, 16, 18, 20], 18)).to.equal(8));
  it('5', () => expect(findInSorted([3, 5, 6, 7, 8, 9, 12, 13, 14, 24, 26, 27], 0)).to.equal(-1));
  it('6', () => expect(findInSorted([3, 5, 6, 7, 8, 9, 12, 12, 14, 24, 26, 27], 12)).to.equal(6));
  it('7', () => expect(findInSorted([24, 26, 28, 50, 59], 101)).to.equal(-1));
});
