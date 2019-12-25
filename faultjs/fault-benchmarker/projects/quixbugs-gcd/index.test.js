import { gcd } from './index';
import expect from 'expect';

describe('gcd', () => {
  it('1', () => expect(gcd(17, 0)).toBe(17));
  it('2', () => expect(gcd(13, 13)).toBe(13));
  it('3', () => expect(gcd(37, 600)).toBe(1));
  it('4', () => expect(gcd(20, 100)).toBe(20));
  it('5', () => expect(gcd(624129, 2061517)).toBe(18913));
  it('6', () => expect(gcd(3, 12)).toBe(3));
});
