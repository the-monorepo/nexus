export const maxSublistSum = (arr) => {
  let maxEndingHere = 0;
  let maxSoFar = 0;

  for(const x of arr) {
    maxEndingHere = maxEndingHere + x;
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
  }

  return maxSoFar;
}

/*
export const maxSublistSum = (arr) => {
  let maxEndingHere = 0;
  let maxSoFar = 0;

  for(const x of arr) {
    maxEndingHere = Math.max(0, maxEndingHere + x);
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
  }

  return maxSoFar;
}
*/
