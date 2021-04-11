import broadcaster from '../src/index';

async function* createTestIterable() {
  let i = 0;
  while(true) {
    yield i;
    i++;
  }
}

it(broadcaster.name, async () => {
  const iterator = createTestIterable();

  const broadcastIterable = broadcaster(iterator);

  const a = broadcastIterable[Symbol.asyncIterator]();

  const result0 = await a.next();
  expect(result0.value).toBe(0);

  const b = broadcastIterable[Symbol.asyncIterator]();

  const [result1a, result2a] = await Promise.all([a.next(), a.next()]);
  expect([result1a.value, result2a.value]).toEqual([1, 2]);

  const result1b = await b.next();
  expect(result1b.value).toBe(1);

  const result2b = await b.next();
  expect(result2b.value).toBe(2);
});
