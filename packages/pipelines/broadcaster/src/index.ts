const broadcaster = <I>(iterable: AsyncIterable<I>) => {
  const iterator = iterable[Symbol.asyncIterator]();
  const nextItemPleaseQueue: ((value: IteratorResult<I>) => any)[] = [];

  let isMutexLocked = false;
  const askToGetNext = async () => {
    if (isMutexLocked) {
      return;
    }
    isMutexLocked = true;
    const result = await iterator.next();

    for (const push of nextItemPleaseQueue) {
      push(result);
    }

    isMutexLocked = false;
  };

  return {
    [Symbol.asyncIterator]() {
      const buffer: IteratorResult<I>[] = [];
      const waitingQueue: ((i: IteratorResult<I>) => any)[] = [];

      const push = (args: IteratorResult<I>) => {
        if (waitingQueue.length > 0) {
          waitingQueue.shift()!(args);
        } else {
          buffer.push(args);
        }
      };
      nextItemPleaseQueue.push(push);

      const listenerIterable = {
        async next() {
          if(buffer.length > 0) {
            return buffer.shift()!;
          }

          const promise = new Promise<IteratorResult<I>>((resolve) => {
            waitingQueue.push(resolve);
          });

          await askToGetNext();

          const result = await promise;

          if (waitingQueue.length >= 1) {
            askToGetNext();
          }

          return result;
        },
      };

      return listenerIterable;
    }
  };
}

export default broadcaster;
