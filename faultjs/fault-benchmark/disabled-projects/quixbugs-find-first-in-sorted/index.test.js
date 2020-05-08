import { findFirstInSorted } from './index';
import expect from 'expect';

describe('flatten', () => {
  it('1', () => expect(findFirstInSorted([3, 4, 5, 5, 5, 5, 6], 5)).toBe(2));
  it('1', () => expect(findFirstInSorted([3, 4, 5, 5, 5, 5, 6], 7)).toBe(-1));
  it('1', () => expect(findFirstInSorted([3, 4, 5, 5, 5, 5, 6], 2)).toBe(-1));
  it('1', () => expect(findFirstInSorted([3, 6, 7, 9, 9, 10, 14, 27], 14)).toBe(6));
  it('1', () =>
    expect(findFirstInSorted([0, 1, 6, 8, 13, 14, 67, 128], 80)).toBe(-1));
  it('1', () => expect(findFirstInSorted([0, 1, 6, 8, 13, 14, 67, 128], 67)).toBe(6));
  it('1', () =>
    expect(findFirstInSorted([0, 1, 6, 8, 13, 14, 67, 128], 128)).toBe(7));
});
