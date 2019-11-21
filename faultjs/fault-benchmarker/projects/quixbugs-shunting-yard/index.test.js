import { shuntingYard } from './index';
import { expect } from 'chai';

describe('shuntingYard', () => {
  it('1', () => expect(shuntingYard([])).to.deep.equal([]));
  it('2', () => expect(shuntingYard([30])).to.deep.equal([30]));
  it('3', () => expect(shuntingYard([10, "-", 5, "-", 2])).to.deep.equal([10, 5, "-", 2, "-"]));
  it('4', () => expect(shuntingYard([34, "-", 12, "/", 5])).to.deep.equal([34, 12, 5, "/", "-"]));
  it('5', () => expect(shuntingYard([4, "+", 9, "*", 9, "-", 10, "+", 13])).to.deep.equal([4, 9, 9, "*", "+", 10, "-", 13, "+"]));
  it('6', () => expect(shuntingYard([7, "*", 43, "-", 7, "+", 13, "/", 7])).to.deep.equal([7, 43, "*", 7, "-", 13, 7, "/", "+"]));
})