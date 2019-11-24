import { sqrt } from './index';
import { expect } from 'chai';

describe('sqrt', () => {
  it('1', () => expect(sqrt(2, 0.01)).to.equal(1.4166666666666665));
  it('2', () => expect(sqrt(2, 0.5)).to.equal(1.5));
  it('3', () => expect(sqrt(2, 0.3)).to.equal(1.5));
  it('4', () => expect(sqrt(4, 0.2)).to.equal(2));
  it('5', () => expect(sqrt(27, 0.01)).to.equal(5.196176253962744));
  it('6', () => expect(sqrt(33, 0.05)).to.equal(5.744665154617621));
  it('7', () => expect(sqrt(170, 0.03)).to.equal(13.038404876679632));
});