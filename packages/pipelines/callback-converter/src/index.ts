import map from '@pipelines/map';

export interface CallbackManager<T extends any[]> extends AsyncIterableIterator<T> {
  callback(...args: T): any;
}

const callbackConverter = <I extends any[]>(): CallbackManager<I> => {
  const buffer: I[] = [];
  const waitingQueue: ((v: I) => void)[] = [];

  const push = (args: I) => {
    if (waitingQueue.length > 0) {
      waitingQueue.shift()!(args);
    } else {
      buffer.push(args);
    }
  };

  return {
    callback(...args: I) {
      return push(args);
    },
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      if (buffer.length > 0) {
        return { done: false, value: buffer.shift()! };
      }

      const promise = new Promise<I>((resolve) => {
        waitingQueue.push(resolve);
      });

      const value = await promise;

      return { done: false, value };
    },
  };
};

export default callbackConverter;

export interface SingleParamCallbackManager<T> extends AsyncIterable<T> {
  callback(arg: T): any;
}

export const singleParamCallbackConverter = <I>(): SingleParamCallbackManager<I> => {
  const converter = callbackConverter<[I]>();
  const iterable = map(converter, ([v]) => v);
  return {
    [Symbol.asyncIterator]() {
      return iterable[Symbol.asyncIterator]();
    },
    callback: converter.callback,
  };
};
