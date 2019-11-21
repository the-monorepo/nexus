import { kheapsort } from './index';
import { expect } from 'chai';

describe('kheapsort', () => {
  it('1', () => expect(kheapsort([1, 2, 3, 4, 5], 0)).to.deep.equal([1, 2, 3, 4, 5]));
  it('2', () => expect(kheapsort([3, 2, 1, 5, 4], 2)).to.deep.equal([1, 2, 3, 4, 5]));
  it('3', () => expect(kheapsort([5, 4, 3, 2, 1], 4)).to.deep.equal([1, 2, 3, 4, 5]));
  it('4', () => expect(kheapsort([3, 12, 5, 1, 6], 3)).to.deep.equal([1, 3, 5, 6, 12]));
});