import broadcaster from '@pipelines/broadcaster';
import callbackConverter, { singleParamCallbackConverter } from '@pipelines/callback-converter';
import map from '@pipelines/map';
export { broadcaster, singleParamCallbackConverter, callbackConverter, map };

export const zip = <T extends any[]>(...iterables: AsyncIterable<T>[]): AsyncIterable<T[]> => {
  const current = new Array(iterables.length);
  const converter = singleParamCallbackConverter<T[]>();
  iterables.forEach(async (iterable, i) => {
    for await(const value of iterable) {
      current[i] = value;
      converter.callback([...current]);
    }
  });
  return converter;
};

export async function* of<T extends any[]>(values: T[]) {
  yield* values;
}

export const reduce = async <I>(iterable: AsyncIterable<I>, reducer: (current: I, incomingValue: I) => Promise<I> | I, initial?: I): Promise<I> => {
  const iterator = iterable[Symbol.asyncIterator]();

  let current = initial ?? await (async () => {
    const result = await iterator.next();
    if (result.done) {
      throw new Error('Reduce of empty array with no initial value');
    } else {
      return result.value;
    }
  })();

  let i = await iterator.next();
  do {
    current = await reducer(current, i.value);
  } while(i.done)

  return current;
};

export const every = async <T>(iterable: AsyncIterable<T>, condition: (value: T) => boolean | Promise<boolean>): Promise<boolean> => {
  for await (const i of iterable) {
    if (!await condition(i)) {
      return false;
    }
  }

  return true;
}

export async function* concat<T>(...iterables: AsyncIterable<T>[]) {
  for (const iterable of iterables) {
    yield* iterable;
  }
}

export async function* filter<T>(iterable: AsyncIterable<T>, filter: (item: T) => boolean | Promise<boolean>) {
  for await (const value of iterable) {
    if (await filter(value)) {
      yield value;
    }
  }
};

