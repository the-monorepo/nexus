import expect from 'expect';
import { kth } from './index';

describe('kth', () => {
  it('1', () => expect(kth([1, 2, 3, 4, 5, 6, 7], 4)).toBe(5));
  it('2', () => expect(kth([3, 6, 7, 1, 6, 3, 8, 9], 5)).toBe(7));
  it('3', () => expect(kth([3, 6, 7, 1, 6, 3, 8, 9], 2)).toBe(3));
  it('4', () => expect(kth([2, 6, 8, 3, 5, 7], 0)).toBe(2));
  it('5', () => expect(kth([34, 25, 7, 1, 9], 4)).toBe(34));
  it('6', () => expect(kth([45, 2, 6, 8, 42, 90, 322], 1)).toBe(6));
  it('7', () => expect(kth([45, 2, 6, 8, 42, 90, 322], 6)).toBe(322));
});
