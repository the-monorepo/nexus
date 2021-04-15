import { map } from '../src';
export async function* infiniteCounter() {
  let i = 0;

  while(true) {
    yield i++;
  }
}

export async function* countToThree() {
  yield* [1, 2, 3];
}

export async function* threeCountersCountingThreeEach() {
  for (let i = 0; i < 3; i++) {
    yield map(countToThree(), (v) => v + 3 * i);
  }
}
