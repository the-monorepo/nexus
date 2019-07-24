import { expect } from 'chai';
import { powerset } from './index';

describe('powerset', () => {
  it('1', () =>
    expect(powerset(['a', 'b', 'c'])).to.deep.equal([
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
    expect(powerset(['a', 'b'])).to.deep.equal([[], ['b'], ['a'], ['a', 'b']]));
  it('3', () => expect(powerset(['a'])).to.deep.equal([[], ['a']]));
  it('4', () => expect(powerset([])).to.deep.equal([[]]));
  it('5', () =>
    expect(powerset(['x', 'df', 'z', 'm'])).to.deep.equal([
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
