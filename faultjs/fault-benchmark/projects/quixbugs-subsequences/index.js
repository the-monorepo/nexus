export const subsequences = (a, b, k) => {
  if (k === 0) {
    return [];
  }

  const ret = [];
  for( let i = a; i < b + 1 - k; i++) {
    ret.push(
      ...subsequences(i + 1, b, k - 1)
        .map(rest => [i, ...rest])
    )
  }

  return ret;
}

/*
export const subsequences = (a, b, k) => {
  if (k === 0) {
    return [[]];
  }

  const ret = [];
  for( let i = a; i < b + 1 - k; i++) {
    ret.push(
      ...subsequences(i + 1, b, k - 1)
        .map(rest => [i, ...rest])
    )
  }

  return ret;
}
*/