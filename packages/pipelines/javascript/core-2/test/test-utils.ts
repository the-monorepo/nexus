import { map } from '../src/index.ts';

export async function* infiniteCounter() {
  let i = 0;

  while (true) {
    yield i++;
  }
}

export async function* countToThree() {
  yield* [1, 2, 3];
}

// eslint-disable-next-line require-yield
export async function* returnOne() {
  return 1;
}

export async function* threeCountersCountingThreeEach() {
  for (let i = 0; i < 3; i++) {
    yield map(countToThree(), (v) => v + 3 * i);
  }
}

export const itPreservesReturnValue = <T>(
  map: (i: AsyncIterable<T>) => AsyncIterable<T>,
) => {
  it('preserves the return value', async () => {
    const iterable = map(returnOne());
    const i = iterable[Symbol.iterator]();

    let current = await i.next();
    while (!current.done) {
      current = await i.next();
    }

    await expect(current.value).toBe(1);
  });
};
