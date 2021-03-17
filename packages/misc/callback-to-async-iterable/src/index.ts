export const callbackToIterable = <I>() => {
  const queue: I[] = [];

  let waitForQueueResolve: () => void;
  let waitForQueuePromise: Promise<any>;
  const newWaitForQueue = () => {
    waitForQueuePromise = new Promise(resolve => waitForQueueResolve = resolve);
  };
  newWaitForQueue();

  const callback = (input: I) => {
    queue.push(input);
    if (queue.length === 1) {
      waitForQueueResolve();
      newWaitForQueue();
    }
  };

  const asyncIterable: AsyncIterableIterator<I> = {
    async next() {
      await waitForQueuePromise;
      return { done: false, value: queue.pop()!, };
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
