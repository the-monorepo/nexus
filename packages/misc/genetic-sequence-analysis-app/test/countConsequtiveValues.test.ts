import { countConsequtiveValues, BaseLocation } from '../src/countConsequtiveValues.ts'
const countConsequtiveValuesToArray = async <T>(sequence: Iterable<T>): Promise<BaseLocation<T>[]> => {
  const locations: BaseLocation<T>[] = [];

  const iterable = countConsequtiveValues(sequence);
  for await(const location of iterable) {
    locations.push(location);
  }

  return locations;
};

describe(countConsequtiveValuesToArray.name, () => {
  it('empty string', async () => {
    await expect(countConsequtiveValuesToArray('')).resolves.toEqual([]);
  });
  it('"a"', async () => {
    await expect(countConsequtiveValuesToArray('a')).resolves.toEqual([{
      index: 0,
      count: 1,
      value: 'a',
    }]);
  });
  it('"aa"', async () => {
    await expect(countConsequtiveValuesToArray('aa')).resolves.toEqual([{
      index: 0,
      count: 2,
      value: 'a',
    }]);
  });
  it('"aab"', async () => {
    await expect(countConsequtiveValuesToArray('aab')).resolves.toEqual([{
      index: 0,
      count: 2,
      value: 'a',
    }, {
      index: 2,
      count: 1,
      value: 'b'
    }]);
  });
  it('"abcaa"', async () => {
    await expect(countConsequtiveValuesToArray('abbbcaa')).resolves.toEqual([{
      index: 0,
      count: 1,
      value: 'a',
    }, {
      index: 1,
      count: 3,
      value: 'b'
    }, {
      index: 4,
      count: 1,
      value: 'c'
    }, {
      index: 5,
      count: 2,
      value: 'a'
    }]);
  });
});
