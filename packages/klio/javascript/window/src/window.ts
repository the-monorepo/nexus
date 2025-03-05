export function* window<T>(list: ArrayLike<T>, windowLength: number) {
  for (let i = windowLength; i <= list.length; i++) {
    yield (function* data() {
      for (let l = i - windowLength; l < i; l++) {
        yield list[l];
      }
    })();
  }
}
