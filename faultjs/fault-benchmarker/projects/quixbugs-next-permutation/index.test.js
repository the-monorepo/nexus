import { nextPermutation } from './index';
import { expect } from 'chai';

describe('nextPermutation', () => {
  it('1', () => expect(nextPermutation([3, 2, 4, 1])).to.deep.equal([3, 4, 1, 2]));
  it('2', () => expect(nextPermutation([3, 5, 6, 2, 1])).to.deep.equal([3, 6, 1, 2, 5]));
  it('3', () => expect(nextPermutation([3, 5, 6, 2])).to.deep.equal([3, 6, 2, 5]));
  it('4', () => expect(nextPermutation([4, 5, 1, 7, 9])).to.deep.equal([4, 5, 1, 9, 7]));
  it('5', () => expect(nextPermutation([4, 5, 8, 7, 1])).to.deep.equal([4, 7, 1, 5, 8]));
  it('6', () => expect(nextPermutation([9, 5, 2, 6, 1])).to.deep.equal([9, 5, 6, 1, 2]));
  it('7', () => expect(nextPermutation([44, 5, 1, 7, 9])).to.deep.equal([44, 5, 1, 9, 7]));
  it('8', () => expect(nextPermutation([3, 4, 5])).to.deep.equal([3, 5, 4]));

});