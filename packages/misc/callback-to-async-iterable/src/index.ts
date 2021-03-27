export interface CallbackManager<T extends any[]> extends AsyncIterable<T> {
  callback(...args: T): any;
}
const callbackToAsyncIterable = <I extends any[]>(): CallbackManager<I> => {
  const waitingQueue: Map<any, ((input: I) => any)[]> = new Map();

  const callback = (...args: I) => {
    if (waitingQueue.size >= 1) {
      for(const [key, queue] of waitingQueue) {
        queue.shift()!(args);
        if (queue.length === 0) {
          waitingQueue.delete(key);
        }
      }
    }
  };

  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          if (!waitingQueue.has(this)) {
            waitingQueue.set(this, []);
          }

          const promise = new Promise<I>((resolve) => {
            waitingQueue.get(this)!.push(resolve);
          });

          return { done: false, value: await promise };
        }
      };
    },
    callback,
  };
};

export default callbackToAsyncIterable;
