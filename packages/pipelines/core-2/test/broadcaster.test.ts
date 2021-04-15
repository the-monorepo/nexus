import { broadcaster } from '../src/index';

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

  console.log(0)
  const result0 = await a.next();
  expect(result0.value).toBe(0);

  console.log(1)
  const b = broadcastIterable[Symbol.asyncIterator]();

  console.log(2)
  const [result1a, result2a] = await Promise.all([a.next(), a.next()]);
  expect([result1a.value, result2a.value]).toEqual([1, 2]);

  console.log(3)
  const [result1b, result2b] = await Promise.all([b.next(), b.next()]);
  expect([result1b.value, result2b.value]).toEqual([1, 2]);
});
