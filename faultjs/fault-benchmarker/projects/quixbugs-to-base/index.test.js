import { toBase } from './index';
import expect from 'expect';

describe('gcd', () => {
  it('1', () => expect(toBase(8227, 18)).toBe("1771"));
  it('2', () => expect(toBase(73, 8)).toBe("111"));
  it('3', () => expect(toBase(16, 19)).toBe("G"));
  it('4', () => expect(toBase(31, 16)).toBe("1F"));
  it('5', () => expect(toBase(41, 2)).toBe("101001"));
  it('6', () => expect(toBase(44, 5)).toBe("134"));
  it('7', () => expect(toBase(27, 23)).toBe("14"));
  it('8', () => expect(toBase(56, 23)).toBe("2A"));
  it('9', () => expect(toBase(8237, 24)).toBe("E75"));
  it('10', () => expect(toBase(8237, 34)).toBe("749"));
});
