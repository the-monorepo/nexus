import { sieve } from './index';
import { expect } from 'chai';

describe('sieve', () => {
  it('1', () => expect(sieve(1)).to.deep.equal([]));
  it('2', () => expect(sieve(2)).to.deep.equal([2]));
  it('3', () => expect(sieve(4)).to.deep.equal([2, 3]));
  it('4', () => expect(sieve(7)).to.deep.equal([2, 3, 5, 7]));
  it('5', () => expect(sieve(20)).to.deep.equal([2, 3, 5, 7, 11, 13, 17, 19]));
  it('6', () => expect(sieve(50)).to.deep.equal([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]));
});