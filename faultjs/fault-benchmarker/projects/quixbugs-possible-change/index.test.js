import { possibleChange } from './index';
import expect from 'expect';

describe('possibleChange', () => {
  it('1', () => expect(possibleChange([1, 4, 2], -7)).toBe(0));
  it('2', () => expect(possibleChange([1, 5, 10, 25], 11)).toBe(4));
  it('3', () => expect(possibleChange([1, 5, 10, 25], 75)).toBe(121));
  it('4', () => expect(possibleChange([1, 5, 10, 25], 34)).toBe(18));
  it('5', () => expect(possibleChange([1, 5, 10], 34)).toBe(16));
  it('6', () => expect(possibleChange([1, 5, 10, 25], 140)).toBe(568));
  it('7', () => expect(possibleChange([1, 5, 10, 25, 50], 140)).toBe(786));
  it('8', () => expect(possibleChange([1, 5, 10, 25, 50, 100], 140)).toBe(817));
  it('9', () => expect(possibleChange([1, 3, 7, 42, 78], 140)).toBe(981));
  it('10', () => expect(possibleChange([3, 7, 42, 78], 140)).toBe(20));
});