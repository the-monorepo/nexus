import { shuntingYard } from './index';
import expect from 'expect';

describe('shuntingYard', () => {
  it('1', () => expect(shuntingYard([])).toEqual([]));
  it('2', () => expect(shuntingYard([30])).toEqual([30]));
  it('3', () => expect(shuntingYard([10, "-", 5, "-", 2])).toEqual([10, 5, "-", 2, "-"]));
  it('4', () => expect(shuntingYard([34, "-", 12, "/", 5])).toEqual([34, 12, 5, "/", "-"]));
  it('5', () => expect(shuntingYard([4, "+", 9, "*", 9, "-", 10, "+", 13])).toEqual([4, 9, 9, "*", "+", 10, "-", 13, "+"]));
  it('6', () => expect(shuntingYard([7, "*", 43, "-", 7, "+", 13, "/", 7])).toEqual([7, 43, "*", 7, "-", 13, 7, "/", "+"]));
})