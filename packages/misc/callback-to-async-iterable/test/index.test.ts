import { callbackToIterable } from '../src/index';

describe(callbackToIterable.name, () => {
  describe('Start listening at 1, call with 0, 1, 2, 3, receive 1, 2, 3', () => {
    it('Single iterable', async () => {
      const iterable = callbackToIterable<[number]>();

      const iterator = iterable[Symbol.asyncIterator]();

      iterable.callback(0);

      const nextPromises = Promise.all([iterator.next(), iterator.next(), iterator.next()]);

      iterable.callback(1);
      iterable.callback(2);
      iterable.callback(3);

      const values = (await nextPromises).map(({ value }) => value);
      expect(values).toEqual([[1], [2], [3]]);
    });
    it('AND ALSO with another iterable that starts at 2 and receives 2, 3', async () => {
      const iterable = callbackToIterable<[number]>();

      iterable.callback(1);

      const iterator1 = iterable[Symbol.asyncIterator]();
      const iterator2 = iterable[Symbol.asyncIterator]();

      const iterator1promise1 = iterator1.next();
      iterable.callback(1);

      const iterator1promise2 = iterator1.next();
      const iterator2promise2 = iterator2.next();
      iterable.callback(2);

      const iterator1promise3 = iterator1.next();
      const iterator2promise3 = iterator2.next();
      iterable.callback(3);

      expect((await iterator1promise1).value).toEqual([1]);

      expect((await iterator1promise2).value).toEqual([2]);
      expect((await iterator1promise3).value).toEqual([3]);

      expect((await iterator2promise2).value).toEqual([2]);
      expect((await iterator2promise3).value).toEqual([3]);
    });
  });
});
