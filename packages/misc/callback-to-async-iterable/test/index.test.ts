import { callbackToIterable } from '../src/index';

describe(callbackToIterable.name, () => {
  it('Start listening, call with 1, 2, 3, receive 1, 2, 3', async () => {
    const { createIterable, callback } = callbackToIterable<[number]>();

    const iterable = createIterable();

    const nextPromises = Promise.all([iterable.next(), iterable.next() ,iterable.next()]);

    callback(1);
    callback(2);
    callback(3);

    const values = (await nextPromises).map(({ value }) => value);
    expect(values).toEqual([[1], [2], [3]]);
  })
});
