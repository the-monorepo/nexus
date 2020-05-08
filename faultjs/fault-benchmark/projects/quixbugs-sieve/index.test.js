import { sieve } from './index';
import expect from 'expect';

describe('sieve', () => {
  it('1', () => expect(sieve(1)).toEqual([]));
  it('2', () => expect(sieve(2)).toEqual([2]));
  it('3', () => expect(sieve(4)).toEqual([2, 3]));
  it('4', () => expect(sieve(7)).toEqual([2, 3, 5, 7]));
  it('5', () => expect(sieve(20)).toEqual([2, 3, 5, 7, 11, 13, 17, 19]));
  it('6', () => expect(sieve(50)).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]));
});