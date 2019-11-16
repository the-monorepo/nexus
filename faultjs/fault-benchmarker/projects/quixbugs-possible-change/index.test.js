import { possibleChange } from './index';
import { expect } from 'chai';

describe('possibleChange', () => {
  it('1', () => expect(possibleChange([1, 4, 2], -7)).to.equal(0));
  it('2', () => expect(possibleChange([1, 5, 10, 25], 11)).to.equal(4));
  it('3', () => expect(possibleChange([1, 5, 10, 25], 75)).to.equal(121));
  it('4', () => expect(possibleChange([1, 5, 10, 25], 34)).to.equal(18));
  it('5', () => expect(possibleChange([1, 5, 10], 34)).to.equal(16));
  it('6', () => expect(possibleChange([1, 5, 10, 25], 140)).to.equal(568));
  it('7', () => expect(possibleChange([1, 5, 10, 25, 50], 140)).to.equal(786));
  it('8', () => expect(possibleChange([1, 5, 10, 25, 50, 100], 140)).to.equal(817));
  it('9', () => expect(possibleChange([1, 3, 7, 42, 78], 140)).to.equal(981));
  it('10', () => expect(possibleChange([3, 7, 42, 78], 140)).to.equal(20));
});