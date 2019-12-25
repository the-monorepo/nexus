import expect from 'expect';
import { rpnEval } from './index';

describe('rpnEval', () => {
  it('1', () => expect(rpnEval([3.0, 5.0, "+", 2.0, "/"])).toBe(4.0));
  it('2', () => expect(rpnEval([2.0, 2.0, "+"])).toBe(4.0));
  it('3', () => expect(rpnEval([7.0, 4.0, "+", 3.0, "-"])).toBe(8.0));
  it('4', () => expect(rpnEval([1.0, 2.0, "*", 3.0, 4.0, "*", "+"])).toBe(14.0));
  it('5', () => expect(rpnEval([5.0, 9.0, 2.0, "*", "+"])).toBe(23.0));
  it('6', () => expect(rpnEval([5.0, 1.0, 2.0, "+", 4.0, "*", "+", 3.0, "-"])).toBe(14.0));
});
