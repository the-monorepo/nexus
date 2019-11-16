export const sieve = (max) => {
  const primes = [];
  for(let n = 2; n < max + 1; n++) {
    if (primes.every(p => n % p > 0)) {
      primes.push(n);
    }
  }

  return primes;
}

/*
export const sieve = (max) => {
  const primes = [];
  for(let n = 2; n < max + 1; n++) {
    if (primes.every(p => n % p > 0)) {
      primes.push(n);
    }
  }

  return primes;
}
*/