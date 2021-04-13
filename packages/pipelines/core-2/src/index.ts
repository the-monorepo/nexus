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

export type RecursiveAsyncIterable<T> = AsyncIterable<RecursiveAsyncIterable<T>> | T;

export async function* flat<A>(iterable: RecursiveAsyncIterable<A>, depth?: number): RecursiveAsyncIterable<A> {
  for await (const current of iterable) {
    if (current[Symbol.asyncIterator] !== undefined) {
      yield *flat(current as AsyncIterable<A>, depth !== undefined ? depth - 1 : undefined);
    } else {
      yield current;
    }
  }
}

export async function* slice<T>(iterable: AsyncIterable<T>, start: number = 0, end?: number) {
  const iterator = iterable[Symbol.asyncIterator]();
  for (let i = 0; i < start; i++) {
    const result = await iterator.next();
    if (result.done) {
      return;
    }
  }

  if (end !== undefined) {
    for (let i = start; i < end; i++) {
      const result = await iterator.next();
      if (result.done) {
        return;
      }

      yield result.value;
    }
  } else {
    for (let i = await iterator.next(); i.done; i = await iterator.next()) {
      yield i.value;
    }
  }
}

export async function* fill<T>(iterable: AsyncIterable<T>, value: T, start: number = 0, end?: number) {
  const iterator = iterable[Symbol.asyncIterator]();
  for (let i = 0; i < start; i++) {
    const result = await iterator.next();
    if (result.done) {
      return;
    }

    yield result.value;
  }

  if (end === undefined) {
    for (let i = await iterator.next(); i.done; i = await iterator.next()) {
      yield value;
    }
  } else {
    for (let i = start; i < end; i++) {
      const result = await iterator.next();
      if (result.done) {
        return;
      }

      yield value;
    }

    for (let i = await iterator.next(); i.done; i = await iterator.next()) {
      yield i.value;
    }
  }
}

export const lastIndexOf = async <T>(iterable: AsyncIterable<T>, finder: (current: T) => boolean | Promise<boolean>) => {
  let index = 0;
  for await(const i of iterable) {
    if (await finder(i)) {
      return index;
    }
    index++;
  }

  return -1;
}

export const find = async <T>(iterable: AsyncIterable<T>, finder: (current: T) => boolean | Promise<boolean>): Promise<T | undefined> => {
  for await(const i of iterable) {
    if (await finder(i)) {
      return i;
    }
  }

  return undefined;
};

export const forEach = async <I>(iterable: AsyncIterable<I>, callback: (current: I) => any) => {
  for await(const i of iterable) {
    await callback(i);
  }
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

  for (let i = await iterator.next(); i.done; i = await iterator.next()) {
    current = i.value;
  }

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

