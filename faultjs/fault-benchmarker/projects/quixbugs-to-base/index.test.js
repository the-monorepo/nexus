import { toBase } from './index';
import { expect } from 'chai';

describe('gcd', () => {
  it('1', () => expect(toBase(8227, 18)).to.equal("1771"));
  it('2', () => expect(toBase(73, 8)).to.equal("111"));
  it('3', () => expect(toBase(16, 19)).to.equal("G"));
  it('4', () => expect(toBase(31, 16)).to.equal("1F"));
  it('5', () => expect(toBase(41, 2)).to.equal("101001"));
  it('6', () => expect(toBase(44, 5)).to.equal("134"));
  it('7', () => expect(toBase(27, 23)).to.equal("14"));
  it('8', () => expect(toBase(56, 23)).to.equal("2A"));
  it('9', () => expect(toBase(8237, 24)).to.equal("E75"));
  it('10', () => expect(toBase(8237, 34)).to.equal("749"));
});
