import { getFactors } from './index';
import { expect } from 'chai';

describe('getFactors', () => {
  it('1', () => expect(getFactors(1)).to.deep.equal([]))
  it('2', () => expect(getFactors(100)).to.deep.equal([2, 2, 5, 5]))
  it('1', () => expect(getFactors(101)).to.deep.equal([101]))
  it('1', () => expect(getFactors(104)).to.deep.equal([2,2,2,13]))
  it('1', () => expect(getFactors(2)).to.deep.equal([2]))
  it('1', () => expect(getFactors(3)).to.deep.equal([3]))
});
