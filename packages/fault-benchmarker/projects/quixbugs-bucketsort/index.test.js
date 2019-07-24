import { bucketsort } from './index';
import { expect } from 'chai';

describe('bucketsort', () => {
  it('1', () => expect(bucketsort([], 14)).to.deep.equal([]));
  it('2', () =>
    expect(bucketsort([3, 11, 2, 9, 1, 5], 12)).to.deep.equal([1, 2, 3, 5, 9, 11]));
  it('3', () =>
    expect(bucketsort([3, 2, 4, 2, 3, 5], 6)).to.deep.equal([2, 2, 3, 3, 4, 5]));
  it('4', () =>
    expect(bucketsort([1, 3, 4, 6, 4, 2, 9, 1, 2, 9], 10)).to.deep.equal([
      1,
      1,
      2,
      2,
      3,
      4,
      4,
      6,
      9,
      9,
    ]));
  it('5', () =>
    expect(bucketsort([20, 19, 18, 17, 16, 15, 14, 13, 12, 11], 21)).to.deep.equal([
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
    ]));
  it('6', () =>
    expect(bucketsort([20, 21, 22, 23, 24, 25, 26, 27, 28, 29], 30)).to.deep.equal([
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
    ]));
  it('7', () =>
    expect(bucketsort([8, 5, 3, 1, 9, 6, 0, 7, 4, 2, 5], 10)).to.deep.equal([
      0,
      1,
      2,
      3,
      4,
      5,
      5,
      6,
      7,
      8,
      9,
    ]));
});
