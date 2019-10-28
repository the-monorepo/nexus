export const quicksort = arr => {
  if (arr.length === 0) {
    return [];
  }
  const pivot = arr[0];
  const lesser = quicksort(arr.slice(1).filter(x => x < pivot));
  const greater = quicksort(arr.slice(1).filter(x => x > pivot));
  return lesser.concat(pivot).concat(greater);
};

/*
QuickSort


Input:
arr: A list of ints

Output:
The elements of arr in sorted order*/
