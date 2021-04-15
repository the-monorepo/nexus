export async function* infiniteCounter() {
  let i = 0;

  while(true) {
    yield i++;
  }
}

export async function* countToThree() {
  yield* [1, 2, 3];
}
