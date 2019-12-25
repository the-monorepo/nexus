export const bitcount = n => {
  let count = 0;

  while (n !== 0) {
    n &= n - 1;
    count++;
  }

  return count;
};
/*
export const bitcount = (n) => {
  let count = 0;

  while (n !== 0) {
    n &= n - 1;
    count++;
  }

  return count;
}
*/
