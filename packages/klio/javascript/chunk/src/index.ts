export function* chunk<T>(iterable: Iterable<T>, chunkLength: number): Iterable<T[]> {
  const iterator = iterable[Symbol.iterator]();

  let i = iterator.next();

  let currentArray: T[] = [];

  while (!i.done) {
    if (currentArray.length === chunkLength) {
      yield currentArray;
      currentArray = [];
    }

    currentArray.push(i.value);

    i = iterator.next();
  }

  yield currentArray;
}
