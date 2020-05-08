import { sqrt } from './index';
import expect from 'expect';

describe('sqrt', () => {
  it('1', () => expect(sqrt(2, 0.01)).toBe(1.4166666666666665));
  it('2', () => expect(sqrt(2, 0.5)).toBe(1.5));
  it('3', () => expect(sqrt(2, 0.3)).toBe(1.5));
  it('4', () => expect(sqrt(4, 0.2)).toBe(2));
  it('5', () => expect(sqrt(27, 0.01)).toBe(5.196176253962744));
  it('6', () => expect(sqrt(33, 0.05)).toBe(5.744665154617621));
  it('7', () => expect(sqrt(170, 0.03)).toBe(13.038404876679632));
});