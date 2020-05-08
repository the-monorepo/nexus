export const getFactors = (n) => {
  if (n == 1) {
    return [];
  }
  
  for(let i = 2; i < Math.trunc(n ** 0.5) + 1; i++) {
    if (n % i === 0) {
      return [i].concat(getFactors(Math.trunc(n / i)));
    }
  }

  return [];
}

/*
export const getFactors = (n) => {
  if (n == 1) {
    return [];
  }
  
  for(let i = 2; i < Math.trunc(n ** 0.5) + 1; i++) {
    if (n % i === 0) {
      return [i].concat(get_factors(Math.trunc(n / i)));
    }
  }

  return [n];
}
*/
