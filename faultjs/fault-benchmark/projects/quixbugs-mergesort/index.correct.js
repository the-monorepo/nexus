export const mergesort = (arr) => {
  const merge = (left, right) => {
    const result = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        result.push(left[i]);
        i++;
      } else {
        result.push(right[j]);
        j++;
      }
    }
    result.push(...left.slice(i), ...right.slice(j));
    return result;
  }

  if (arr.length <= 1) {
    return arr;
  } else {
    const middle = Math.trunc(arr.length / 2);
    const left = mergesort(arr.slice(0, middle));
    const right = mergesort(arr.slice(middle));
    return merge(left, right);
  }
}

/*
export const mergesort = (arr) => {
  const merge = (left, right) => {
    const result = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        result.push(left[i]);
        i++;
      } else {
        result.push(right[j]);
        j++;
      }
    }
    result.push(...left.slice(i), ...right.slice(j));
    return result;
  }

  if(arr.length <= 1) {
    return arr;
  } else {
    const middle = Math.trunc(arr.length / 2);
    const left = mergesort(arr.slice(0, middle));
    const right = mergesort(arr.slice(middle));
    return merge(left, right);
  }
}
*/