import { nextPalindrome } from './index';
import expect from 'expect';
describe('nextPalindrome', () => {
  it('1', () => expect(nextPalindrome([1, 4, 9, 4, 1])).toEqual([1, 5, 0, 5, 1]));
  it('2', () => expect(nextPalindrome([1, 3, 1])).toEqual([1, 4, 1]));
  it('3', () =>
    expect(nextPalindrome([4, 7, 2, 5, 5, 2, 7, 4])).toEqual([
      4,
      7,
      2,
      6,
      6,
      2,
      7,
      4,
    ]));
  it('4', () =>
    expect(nextPalindrome([4, 7, 2, 5, 2, 7, 4])).toEqual([4, 7, 2, 6, 2, 7, 4]));
  it('5', () => expect(nextPalindrome([9, 9, 9])).toEqual([1, 0, 0, 1]));
});
