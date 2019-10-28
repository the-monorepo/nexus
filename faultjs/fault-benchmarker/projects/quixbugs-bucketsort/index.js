export const bucketsort = (arr, k) => {
  const counts = new Array(k).fill(0);
  for (const x of arr) {
    counts[x] += 1;
  }

  const sortedArr = [];
  arr.forEach((count, i) => {
    sortedArr.push(...new Array(count).fill(i));
  });

  return sortedArr;
};
