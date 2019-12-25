import expect from 'expect';
import { lis } from './index';

describe('lis', () => {
  it('1', () => expect(lis([])).toBe(0));
  it('2', () => expect(lis([3])).toBe(1));
  it('3', () => expect(lis([10, 20, 11, 32, 22, 48, 43])).toBe(4));
  it('4', () => expect(lis([4, 2, 1])).toBe(1));
  it('5', () => expect(lis([5, 1, 3, 4, 7])).toBe(4));
  it('6', () => expect(lis([4, 1])).toBe(1));
  it('7', () => expect(lis([-1, 0, 2])).toBe(3));
  it('8', () => expect(lis([0, 2])).toBe(2));
  it('9', () => expect(lis([4, 1, 5, 3, 7, 6, 2])).toBe(3));
  it('10', () => expect(lis([10, 22, 9, 33, 21, 50, 41, 60, 80])).toBe(6));
  it('11', () => expect(lis([7, 10, 9, 2, 3, 8, 1])).toBe(3));
  it('12', () => expect(lis([9, 11, 2, 13, 7, 15])).toBe(4));
});
