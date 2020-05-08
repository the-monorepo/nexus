export function* flatten(arr) {
  for(const x of arr) {
    if(Array.isArray(x)) {
      yield* flatten(x);
    } else {
      yield x;
    }
  }
}

/*
export function* flatten(arr) {
  for(const x of arr) {
    if(Array.isArray(arr)) {
      yield* flatten(x);
    } else {
      yield x;
    }
  }
}
*/