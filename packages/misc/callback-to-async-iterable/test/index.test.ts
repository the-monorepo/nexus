import { callbackToIterable } from '../src/index';

describe(callbackToIterable.name, () => {
  it('A single async iterable listening from the start yields all values', async () => {
    const { createIterable, callback } = callbackToIterable<number>();

    const iterable = createIterable();
    callback(1);
    callback(2);
    callback(3);

    const values: number[] = [];
    for await (const i of iterable) {
      values.push(i);
    }

    expect(values).toEqual([1, 2, 3]);
  })
});
