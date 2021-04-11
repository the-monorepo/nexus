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
