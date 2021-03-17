export const callbackToIterable = <I extends any[]>() => {
  const bufferQueue: I[] = [];
  const waitingQueue: ((input: I) => any)[] = [];

  const callback = (...args: I) => {
    if (waitingQueue.length >= 1) {
      waitingQueue.shift()!(args);
    } else {
      bufferQueue.push(args);
    }
  };

  const asyncIterable: AsyncIterableIterator<I> = {
    async next() {
      if (bufferQueue.length >= 1) {
        return { done: false, value: bufferQueue.shift()! };
      } else {
        const promise = new Promise<I>((resolve) => {
          waitingQueue.push(resolve);
        });

        return { done: false, value: await promise };
        }
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  }
  const createIterable = () => {
    return asyncIterable;
  };

  return {
    createIterable,
    callback,
  }
};
