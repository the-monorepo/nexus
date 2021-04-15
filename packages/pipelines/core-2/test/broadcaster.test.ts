import { broadcaster } from '../src/index';

import { infiniteCounter } from './test-iterables';

it(broadcaster.name, async () => {
  const iterator = infiniteCounter();

  const broadcastIterable = broadcaster(iterator);

  const a = broadcastIterable[Symbol.asyncIterator]();

  const result0 = await a.next();
  expect(result0.value).toBe(0);

  const b = broadcastIterable[Symbol.asyncIterator]();

  const [result1a, result2a] = await Promise.all([a.next(), a.next()]);
  expect([result1a.value, result2a.value]).toEqual([1, 2]);

  const [result1b, result2b] = await Promise.all([b.next(), b.next()]);
  expect([result1b.value, result2b.value]).toEqual([1, 2]);
});
