import expect from 'expect';
import { powerset } from './index';

describe('powerset', () => {
  it('1', () =>
    expect(powerset(['a', 'b', 'c'])).toEqual([
      [],
      ['c'],
      ['b'],
      ['b', 'c'],
      ['a'],
      ['a', 'c'],
      ['a', 'b'],
      ['a', 'b', 'c'],
    ]));
  it('2', () =>
    expect(powerset(['a', 'b'])).toEqual([[], ['b'], ['a'], ['a', 'b']]));
  it('3', () => expect(powerset(['a'])).toEqual([[], ['a']]));
  it('4', () => expect(powerset([])).toEqual([[]]));
  it('5', () =>
    expect(powerset(['x', 'df', 'z', 'm'])).toEqual([
      [],
      ['m'],
      ['z'],
      ['z', 'm'],
      ['df'],
      ['df', 'm'],
      ['df', 'z'],
      ['df', 'z', 'm'],
      ['x'],
      ['x', 'm'],
      ['x', 'z'],
      ['x', 'z', 'm'],
      ['x', 'df'],
      ['x', 'df', 'm'],
      ['x', 'df', 'z'],
      ['x', 'df', 'z', 'm'],
    ]));
});
