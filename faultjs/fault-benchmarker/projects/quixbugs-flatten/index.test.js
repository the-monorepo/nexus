import { flatten } from './index';
import expect from 'expect';

describe('flatten', () => {
  it('1', () => expect([...flatten([1, [], [2, 3], [[4]], 5])]).toEqual([1, 2, 3, 4, 5]));
  it('2', () => expect([...flatten([[], [], [], [], []])]).toEqual([]));  
  it('3', () => expect([...flatten([[], [], 1, [], 1, [], []])]).toEqual([1, 1]));
  it('4', () => expect([...flatten([1, 2, 3, [[4]]])]).toEqual([1, 2, 3, 4]));
  it('5', () => expect([...flatten([1, 4, 6])]).toEqual([1, 4, 6]));
  it('6', () => expect([...flatten(['moe', 'curly', 'larry'])]).toEqual(['moe', 'curly', 'larry']));
  it('7', () => expect([...flatten(['a', 'b', ['c'], ['d', [['e']]]])]).toEqual(['a', 'b', 'c', 'd', 'e']));
});