import { broadcaster } from '../src/index.ts';

import { infiniteCounter } from './test-utils.ts';

it(broadcaster.name, async () => {
  const iterator = infiniteCounter();

  const broadcastIterable = broadcaster(iterator);

  const a = broadcastIterable[Symbol.asyncIterator]();

  const result0a = await a.next();
  expect(result0a.value).toBe(0);

  const b = a[Symbol.asyncIterator]();

  const [result1a, result2a] = await Promise.all([a.next(), a.next()]);
  expect([result1a.value, result2a.value]).toEqual([1, 2]);

  const [result1b, result2b] = await Promise.all([b.next(), b.next()]);
  expect([result1b.value, result2b.value]).toEqual([1, 2]);

  const c = broadcastIterable[Symbol.asyncIterator]();
  const result0c = await c.next();
  expect(result0c.value).toBe(0);
});
