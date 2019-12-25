export const findFirstInSorted = (arr, x) => {
  let lo = 0;
  let hi = arr.length;

  while (lo < hi) {
    const mid = Math.trunc((lo + hi) / 2);

    if (x === arr[mid] && (mid === 0 || x !== arr[mid - 1])) {
      return mid;
    } else if (x <= arr[mid]) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return -1;
};

/*
export const findFirstInSorted = (arr, x) => {
  let lo = 0;
  let hi = arr.length;

  while (lo < hi) {
    const mid = (lo + hi);

    if (x === arr[mid] && (mid === 0 || x !== arr[mid - 1])) {
      return mid;
    } else if (x <= arr[mid]) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return -1;
}
*/
