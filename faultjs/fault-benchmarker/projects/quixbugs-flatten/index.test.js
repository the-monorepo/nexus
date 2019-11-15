import { flatten } from './index';
import { expect } from 'chai';

describe('flatten', () => {
  it('1', () => expect([...flatten([1, [], [2, 3], [[4]], 5])]).to.deep.equal([1, 2, 3, 4, 5]));
  it('2', () => expect([...flatten([[], [], [], [], []])]).to.deep.equal([]));  
  it('3', () => expect([...flatten([[], [], 1, [], 1, [], []])]).to.deep.equal([1, 1]));
  it('4', () => expect([...flatten([1, 2, 3, [[4]]])]).to.deep.equal([1, 2, 3, 4]));
  it('5', () => expect([...flatten([1, 4, 6])]).to.deep.equal([1, 4, 6]));
  it('6', () => expect([...flatten(['moe', 'curly', 'larry'])]).to.deep.equal(['moe', 'curly', 'larry']));
  it('7', () => expect([...flatten(['a', 'b', ['c'], ['d', [['e']]]])]).to.deep.equal(['a', 'b', 'c', 'd', 'e']));
});