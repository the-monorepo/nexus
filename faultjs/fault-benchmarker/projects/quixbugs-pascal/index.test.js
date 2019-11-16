import { pascal } from './index';
import { expect } from 'chai';

describe('pascal', () => {
  it('1', () => expect(pascal(1)).to.deep.equal([[1]]));
  it('2', () => expect(pascal(2)).to.deep.equal([[1], [1, 1]]));
  it('3', () => expect(pascal(3)).to.deep.equal([[1], [1, 1], [1, 2, 1]]));
  it('4', () => expect(pascal(4)).to.deep.equal([[1], [1, 1], [1, 2, 1], [1, 3, 3, 1]]));
  it('5', () => expect(pascal(5)).to.deep.equal([[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]]));
});