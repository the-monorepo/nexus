import { gcd } from './index';
import { expect } from 'chai';

describe('gcd', () => {
  it('1', () => expect(gcd(17, 0)).to.equal(17));
  it('2', () => expect(gcd(13, 13)).to.equal(13));
  it('3', () => expect(gcd(37, 600)).to.equal(1));
  it('4', () => expect(gcd(20, 100)).to.equal(20));
  it('5', () => expect(gcd(624129, 2061517)).to.equal(18913));
  it('6', () => expect(gcd(3, 12)).to.equal(3));
});
