import { hanoi } from './index';
import expect from 'expect';

describe('hanoi', () => {
  it('1', () => expect(hanoi(0, 1, 3)).toEqual([]));
  it('2', () => expect(hanoi(1, 1, 3)).toEqual([[1, 3]]));
  it('3', () => expect(hanoi(2, 1, 3)).toEqual([[1, 2], [1, 3], [2, 3]]));
  it('4', () =>
    expect(hanoi(3, 1, 3)).toEqual([
      [1, 3],
      [1, 2],
      [3, 2],
      [1, 3],
      [2, 1],
      [2, 3],
      [1, 3],
    ]));
  it('5', () =>
    expect(hanoi(4, 1, 3)).toEqual([
      [1, 2],
      [1, 3],
      [2, 3],
      [1, 2],
      [3, 1],
      [3, 2],
      [1, 2],
      [1, 3],
      [2, 3],
      [2, 1],
      [3, 1],
      [2, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ]));
  it('6', () => expect(hanoi(2, 1, 2)).toEqual([[1, 3], [1, 2], [3, 2]]));
  it('7', () => expect(hanoi(2, 1, 1)).toEqual([[1, 2], [1, 1], [2, 1]]));
  it('8', () => expect(hanoi(2, 3, 1)).toEqual([[3, 2], [3, 1], [2, 1]]));
});
