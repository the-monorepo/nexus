import { Bases } from 'nucleotide-bases';
export type BaseLocation<T = Bases> = {
  index: number;
  count: number;
  value: T;
};

export async function* countConsequtiveValues<T>(
  values: AsyncIterable<T> | Iterable<T>,
): AsyncGenerator<BaseLocation<T>> {
  const iterator = values[Symbol.iterator]();
  const firstItemPair = iterator.next();
  if (firstItemPair.done) {
    return;
  }
  let current: BaseLocation<T> = {
    index: 0,
    count: 1,
    value: firstItemPair.value,
  };
  for await (const value of iterator) {
    if (current.value !== value) {
      yield current;
      current = {
        index: current.index + current.count,
        count: 1,
        value,
      };
    } else {
      current.count++;
    }
  }
  yield current;
}
