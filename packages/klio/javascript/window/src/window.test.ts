import { window } from './window';

const arbitraryWindowLength = 5;
const arbitraryList = [1, 2, 3];

const windowWithLists = (theList, windowLength) => [...window(theList, windowLength).map((a) => [...a])];

describe(window.name, () => {
  it('empty list => yields empty list', () => {
    expect(windowWithLists([], arbitraryWindowLength)).toEqual([]);
  });

  it('window of 0 => undefined behavior', () => {
    expect(windowWithLists(arbitraryList, 0)).toEqual(expect.anything());
  });

  it('window of 1 => yields each item in its own window', () => {
    expect(windowWithLists(arbitraryList, 1)).toEqual(
      arbitraryList.map((v) => [v]),
    );
  });

  it('window of 2 => windows through each item in pairs of 2', () => {
    expect(windowWithLists([1, 2, 3, 4, 5], 2)).toEqual([
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5]
    ]);
  });

  it('window bigger than list => returns an empty list', () => {
    expect([...window([1, 2, 3, 4, 5], 6).map((a) => [...a])]).toEqual([
    ]);
  });
});
