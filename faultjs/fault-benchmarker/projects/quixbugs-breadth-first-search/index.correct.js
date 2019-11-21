export const kth = (arr, k) => {
  const pivot = arr[0];
  const below = arr.filter(x => x < pivot);
  const above = arr.filter(x => x > pivot);

  const numLess = below.length;
  const numLessOrReq = arr.length - above.length;

  if (k < numLess) {
    return kth(below, k);
  } else if (k >= numLessOrReq) {
    return kth(above, k - numLessOrReq);
  } else {
    return pivot;
  }
}

/*
export const kth = (arr, k) => {
  const pivot = arr[0];
  const below = arr.filter(x => x < pivot);
  const above = arr.filter(x => x > pivot);

  const numLess = below.length;
  const numLessOrReq = arr.length - above.length;

  if (k < numLess) {
    return kth(below, k);
  } else if (k >= numLessOrReq) {
    return kth(above, k - numLessOrReq);
  } else {
    return pivot;
  }
}
*/