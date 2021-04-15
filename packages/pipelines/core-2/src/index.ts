import callbackConverter, {
  singleParamCallbackConverter,
} from '@pipelines/callback-converter';
import map from '@pipelines/map';
import { createPayload, createFailure, hasFailure, Result } from '@resultful/result';
export { singleParamCallbackConverter, callbackConverter, map };

class IteratorResultEmitter<T> implements AsyncIterableIterator<T> {
  private readonly waitingQueue: ((v: IteratorResult<T>) => any)[] = [];
  constructor(private readonly buffer: BufferStore<IteratorResult<T>> = []) {}

  push(value: IteratorResult<T>) {
    console.log('test', value);
    if (this.waitingQueue.length >= 1) {
      this.waitingQueue.shift()!(value);
    } else {
      this.buffer.push(value);
    }

    if (value.done) {
      this.finish();
    }
  }

  get bufferLength() {
    return this.buffer.length;
  }

  get queueLength() {
    return this.waitingQueue.length;
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.buffer.length >= 1) {
      return this.buffer.shift()!;
    } else {
      return new Promise<IteratorResult<T>>((resolve) => this.waitingQueue.push(resolve));
    }
  }

  private finish() {
    for (const resolve of this.waitingQueue) {
      resolve({ value: undefined, done: true });
    }
    this.waitingQueue.length = 0;
  }

  [Symbol.asyncIterator](): IteratorResultEmitter<T> {
    return this;
  }
}

class Emitter<T> implements AsyncIterableIterator<T> {
  private readonly internalEmitter = new IteratorResultEmitter<T>();

  push(value: T) {
    this.internalEmitter.push({ value, done: false });
  }

  async next(): Promise<IteratorResult<T>> {
    return await this.internalEmitter.next();
  }

  finish() {
    // FIXME: Remvoe as any
    return this.internalEmitter.push(({
      value: undefined,
      done: false,
    } as any) as IteratorResult<T>);
  }

  [Symbol.asyncIterator](): Emitter<T> {
    return this;
  }
}

/**
 * @internal This method name is subject to change
 */
export const emitter = <T>(): Emitter<T> => new Emitter<T>();
// TOOD: A lot of these methods do not account for values that are returned from AsyncGenerators since they all use for await... of syntax

class Broadcaster<T> implements AsyncIterableIterator<T> {
  protected readonly emitter: IteratorResultEmitter<T> = new IteratorResultEmitter<T>();

  private constructor(private readonly iterator: AsyncIterator<T>, private readonly broadcasters: Broadcaster<T>[]) {
    broadcasters.push(this);
  }

  static create<T>(iterable: AsyncIterable<T>) {
    return new Broadcaster(iterable[Symbol.asyncIterator](), []);
  }

  async next() {
    if (this.emitter.bufferLength >= 1) {
      const result = await this.emitter.next();
      return result;
    }

    const result = await this.iterator.next();

    for (const broadcaster of this.broadcasters) {
      if (this === broadcaster) {
        continue;
      }
      broadcaster.emitter.push(result);
    }

    return result;
  }

  [Symbol.asyncIterator]() {
    return new Broadcaster(this.iterator, this.broadcasters);
  }
}

/**
 * @internal This method name is subject to change
 */
export const broadcaster = <T>(iterable: AsyncIterable<T>): Broadcaster<T> =>
  Broadcaster.create(iterable);

export const zip = <T extends any[]>(
  ...iterables: AsyncIterable<T>[]
): AsyncIterable<T[]> => {
  const current = new Array(iterables.length);
  const converter = singleParamCallbackConverter<T[]>();
  iterables.forEach(async (iterable, i) => {
    for await (const value of iterable) {
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

export async function* flat<A>(
  iterable: RecursiveAsyncIterable<A>,
  depth?: number,
): RecursiveAsyncIterable<A> {
  for await (const current of iterable) {
    if (current[Symbol.asyncIterator] !== undefined) {
      yield* flat(
        current as AsyncIterable<A>,
        depth !== undefined ? depth - 1 : undefined,
      );
    } else {
      yield current;
    }
  }
}

export async function* slice<T>(
  iterable: AsyncIterable<T>,
  start: number = 0,
  end?: number,
) {
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

export const indexOf = async <T>(iterable: AsyncIterable<T>, value: T) => {
  let index = 0;
  for await (const i of iterable) {
    if (i === value) {
      return index;
    }
    index++;
  }

  return -1;
};

export async function* fill<T>(
  iterable: AsyncIterable<T>,
  value: T,
  start: number = 0,
  end?: number,
) {
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

export const findIndex = async <T>(
  iterable: AsyncIterable<T>,
  finder: (current: T) => boolean | Promise<boolean>,
) => {
  let index = 0;
  for await (const i of iterable) {
    if (await finder(i)) {
      return index;
    }
    index++;
  }

  return -1;
};

export const lastIndexOf = async <T>(
  iterable: AsyncIterable<T>,
  finder: (current: T) => boolean | Promise<boolean>,
) => {
  let index = 0;
  let found = -1;
  for await (const i of iterable) {
    if (await finder(i)) {
      found = index;
    }
    index++;
  }

  return found;
};

export const find = async <T>(
  iterable: AsyncIterable<T>,
  finder: (current: T) => boolean | Promise<boolean>,
): Promise<T | undefined> => {
  for await (const i of iterable) {
    if (await finder(i)) {
      return i;
    }
  }

  return undefined;
};

export const forEach = async <I>(
  iterable: AsyncIterable<I>,
  callback: (current: I) => any,
) => {
  for await (const i of iterable) {
    await callback(i);
  }
};

export class EmptyIterableError extends Error {
  constructor() {
    super('Reduce of empty array with no initial value');
  }
}

export const reduce = async <I>(
  iterable: AsyncIterable<I>,
  reducer: (current: I, incomingValue: I) => Promise<I> | I,
  initial?: I,
): Promise<I> => {
  const iterator = iterable[Symbol.asyncIterator]();

  let current =
    initial ??
    (await (async () => {
      const result = await iterator.next();
      if (result.done) {
        throw new EmptyIterableError();
      } else {
        return result.value;
      }
    })());

  for (let i = await iterator.next(); i.done; i = await iterator.next()) {
    current = i.value;
  }

  return current;
};

export const every = async <T>(
  iterable: AsyncIterable<T>,
  condition: (value: T) => boolean | Promise<boolean>,
): Promise<boolean> => {
  for await (const i of iterable) {
    if (!(await condition(i))) {
      return false;
    }
  }

  return true;
};

export async function* concat<T>(...iterables: AsyncIterable<T>[]) {
  for (const iterable of iterables) {
    yield* iterable;
  }
}

export async function* filter<T>(
  iterable: AsyncIterable<T>,
  filter: (item: T) => boolean | Promise<boolean>,
) {
  for await (const value of iterable) {
    if (await filter(value)) {
      yield value;
    }
  }
}

export async function* delay<T>(iterable: AsyncIterable<T>, interval: number) {
  for await (const v of iterable) {
    yield v;
    await new Promise((resolve) => setInterval(resolve, interval));
  }
}

/**
 * @param iterables Merges these iterables into a single iterable. This "merged" iterable will
 */
export const merge = <T>(...iterables: AsyncIterable<T>[]): AsyncIterable<T> => {
  const converter = singleParamCallbackConverter<T>();

  iterables.forEach(async (iterable) => {
    for await (const v of iterable) {
      converter.callback(v);
    }
  });

  return converter;
};

/**
 * Yields every {@link ms} seconds
 */
export async function* interval(ms: number): AsyncGenerator<void> {
  while (true) {
    await new Promise((resolve) => setInterval(resolve, ms));
    yield;
  }
}

/**
 * An array-like data-structure
 */
export type BufferStore<T> = Pick<Array<T>, 'push' | 'shift' | 'length'>;
class Buffered<T> implements AsyncIterableIterator<T> {
  private readonly waitingQueue: {
    resolve: (v: IteratorResult<T>) => any;
    reject: (err: unknown) => any;
  }[] = [];
  private readonly done: boolean = false;

  constructor(
    iterable: AsyncIterable<T>,
    private readonly buffer: BufferStore<Result<T, any>>,
  ) {
    console.log('constructed');
    (async () => {
      console.log('listening');
      try {
        const iterator = iterable[Symbol.asyncIterator]();
        let i = iterator.next();
        let next = iterator.next();
        while (true) {
          const result = await i;
          if (result.done) {
            return;
          }
          i = next;
          next = iterator.next();
          const value = result.value;
          console.log('received', value);
          if (this.queueLengthLength <= 0) {
            buffer.push(createPayload(value));
          } else {
            this.waitingQueue.pop()!.resolve({ value, done: false });
          }
        }
        for await (const value of iterable) {
          console.log('pushed', value);
        }
        console.log('?');
      } catch (err) {
        console.log(err);
        if (this.queueLengthLength <= 0) {
          buffer.push(createFailure(err));
        } else {
          this.waitingQueue.pop()!.reject(err);
        }
      } finally {
        console.log('done');
        this.killWaitingQueue();
      }
    })();
  }

  get queueLengthLength() {
    return this.waitingQueue.length;
  }

  get bufferLength() {
    return this.buffer.length;
  }

  private killWaitingQueue() {
    this.waitingQueue.forEach((waiting) =>
      waiting.resolve({ value: undefined, done: true }),
    );
    this.waitingQueue.length = 0;
  }

  async next(): Promise<IteratorResult<T>> {
    console.log(this.queueLengthLength, this.bufferLength);
    if (this.buffer.length >= 1) {
      const result = this.buffer.shift()!;
      if (hasFailure(result)) {
        throw result.failure;
      } else {
        return { done: false, value: result.payload };
      }
    } else if (this.done) {
      return { done: this.done, value: undefined };
    } else {
      return new Promise<IteratorResult<T>>((resolve, reject) => {
        this.waitingQueue.push({ resolve, reject });
      });
    }
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
export const bufferred = <T, E = unknown>(
  iterable: AsyncIterable<T>,
  store: BufferStore<Result<T, E>> = [],
): Buffered<T> => {
  return new Buffered(iterable, store);
};

/**
 * @internal Method name subject to change
 */
export type GetLatestValue<T> = () => Promise<T>;

/**
 * @internal Method name subject to change
 */
export function latestValueStore<T>(asyncIterable: AsyncIterable<T>): GetLatestValue<T> {
  const iterator = asyncIterable[Symbol.asyncIterator]();

  let currentPromise: Promise<T>;

  (async () => {
    currentPromise = (async () => {
      const result = await iterator.next();
      if (result.done) {
        throw new EmptyIterableError();
      } else {
        return result.value;
      }
    })();

    await currentPromise;

    let currentResult: IteratorResult<T>;
    while (!(currentResult = await iterator.next()).done) {
      currentPromise = Promise.resolve(currentResult.value);
    }
  })();

  return () => currentPromise;
}
