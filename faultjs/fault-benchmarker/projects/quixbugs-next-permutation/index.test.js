import { nextPermutation } from './index';
import expect from 'expect';

describe('nextPermutation', () => {
  it('1', () => expect(nextPermutation([3, 2, 4, 1])).toEqual([3, 4, 1, 2]));
  it('2', () => expect(nextPermutation([3, 5, 6, 2, 1])).toEqual([3, 6, 1, 2, 5]));
  it('3', () => expect(nextPermutation([3, 5, 6, 2])).toEqual([3, 6, 2, 5]));
  it('4', () => expect(nextPermutation([4, 5, 1, 7, 9])).toEqual([4, 5, 1, 9, 7]));
  it('5', () => expect(nextPermutation([4, 5, 8, 7, 1])).toEqual([4, 7, 1, 5, 8]));
  it('6', () => expect(nextPermutation([9, 5, 2, 6, 1])).toEqual([9, 5, 6, 1, 2]));
  it('7', () => expect(nextPermutation([44, 5, 1, 7, 9])).toEqual([44, 5, 1, 9, 7]));
  it('8', () => expect(nextPermutation([3, 4, 5])).toEqual([3, 5, 4]));

});