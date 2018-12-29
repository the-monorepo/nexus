import { iteratorWithNoDuplicates } from '../src/index.ts';
describe('iteratorWithNoDuplicates', () => {
  it('numbers', () => {
    const arrWithDuplicates = [1, 2, 3, 4, 4, 3, 2, 1];
    expect([...iteratorWithNoDuplicates(arrWithDuplicates)]).toEqual([1, 2, 3, 4]);
  });
  it('keyed', () => {
    const expectedArr = [
      { a: 1, b: 3 },
      { a: 2, b: 4 },
      { a: 3, b: 3 },
      { a: 4, b: 3 },
    ];
    const [item1, item2] = expectedArr;
    expect([...iteratorWithNoDuplicates(expectedArr, (item) => item.b)]).toEqual([
      item1,
      item2,
    ]);
  });
});
