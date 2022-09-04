export function* chunk<T>(iterator: Iterator<T>, chunkLength: number): Iterable<Iterable<T>> {
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
