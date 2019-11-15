export const findInSorted = (arr, x) => {
  const binSearch = (start, end) => {
    if (start === end) {
      return -1;
    }
    const mid = start + Math.trunc((end - start) / 2);
    if (x < arr[mid]) {
      return binSearch(start, mid);
    } else if (x > arr[mid]) {
      return binSearch(mid, end);
    } else {
      return mid;
    }
  };
  return binSearch(0, arr.length);
};

/*
export const findInSorted = (arr, x) => {
  const binSearch = (start, end) => {
    if (start === end) {
      return -1;
    }
    const mid = start + Math.trunc((end - start) / 2);
    if (x < arr[mid]) {
      return binSearch(start, mid);
    } else if (x > arr[mid]) {
      return binSearch(mid + 1, end);
    } else {
      return mid;
    }
  };
  return binSearch(0, arr.length);
};
*/