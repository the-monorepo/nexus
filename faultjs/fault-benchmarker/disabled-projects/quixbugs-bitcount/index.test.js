import { bitcount } from './index';
import expect from 'expect';

describe('bitcount', () => {
  it('1', () => expect(bitcount(127)).toBe(7));
  it('2', () => expect(bitcount(128)).toBe(1));
  it('3', () => expect(bitcount(3005)).toBe(9));
  it('4', () => expect(bitcount(13)).toBe(3));
  it('5', () => expect(bitcount(14)).toBe(3));
  it('6', () => expect(bitcount(27)).toBe(4));
  it('7', () => expect(bitcount(834)).toBe(4));
  it('8', () => expect(bitcount(254)).toBe(7));
  it('9', () => expect(bitcount(256)).toBe(1));
});
