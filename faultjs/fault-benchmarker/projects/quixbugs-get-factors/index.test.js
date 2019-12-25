import { getFactors } from './index';
import expect from 'expect';

describe('getFactors', () => {
  it('1', () => expect(getFactors(1)).toEqual([]))
  it('2', () => expect(getFactors(100)).toEqual([2, 2, 5, 5]))
  it('1', () => expect(getFactors(101)).toEqual([101]))
  it('1', () => expect(getFactors(104)).toEqual([2,2,2,13]))
  it('1', () => expect(getFactors(2)).toEqual([2]))
  it('1', () => expect(getFactors(3)).toEqual([3]))
});
