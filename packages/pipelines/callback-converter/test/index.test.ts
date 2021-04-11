import callbackConverter from '../src/index';

describe(callbackConverter.name, () => {
  describe('Call with 1, 2, 3, receive 1, 2, 3', () => {
    it('Single iterable', async () => {
      const iterable = callbackConverter<[number]>();

      iterable.callback(1);
      iterable.callback(2);

      const nextPromises = Promise.all([
        iterable.next(),
        iterable.next(),
        iterable.next(),
      ]);

      iterable.callback(3);

      const values = (await nextPromises).map(({ value }) => value);
      expect(values).toEqual([[1], [2], [3]]);
    });
    it('2 cloned iterators', async () => {
      const iterable = callbackConverter<[number]>();

      const iterator1 = iterable[Symbol.asyncIterator]();
      const iterator2 = iterable[Symbol.asyncIterator]();

      const iterator1promise1 = iterator1.next();
      const iterator2promise1 = iterator2.next();
      const iterator1promise2 = iterator1.next();

      iterable.callback(1);
      iterable.callback(2);
      iterable.callback(3);

      expect([
        (await iterator1promise1).value,
        (await iterator2promise1).value,
        (await iterator1promise2).value,
      ]).toEqual([[1], [2], [3]]);
    });
  });
});
