import { bitcount } from './index';
import { expect } from 'chai';

describe('bitcount', () => {
  it('1', () => expect(bitcount(127)).to.equal(7));
  it('2', () => expect(bitcount(128)).to.equal(1));
  it('3', () => expect(bitcount(3005)).to.equal(9));
  it('4', () => expect(bitcount(13)).to.equal(3));
  it('5', () => expect(bitcount(14)).to.equal(3));
  it('6', () => expect(bitcount(27)).to.equal(4));
  it('7', () => expect(bitcount(834)).to.equal(4));
  it('8', () => expect(bitcount(254)).to.equal(7));
  it('9', () => expect(bitcount(256)).to.equal(1));
});