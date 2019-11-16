export const nextPermutation = (perm) => {
  for(let i = perm.length - 2; i >= 0; i--) {
    if (perm[i] < perm[i + 1]) {
      for(let j = perm.length - 1; j > i; j--) {
        if (perm[j] < perm[i]) {
          const nextPerm = [...perm];

          [nextPerm[i], nextPerm[j]] = [perm[j], perm[i]];

          const reversed = nextPerm.slice(i + 1).reverse();
          nextPerm.splice(i + 1, reversed.length, ...reversed);

          return nextPerm;
        }
      }
    }
  }
}

/*
export const nextPermutation = (perm) => {
  for(let i = perm.length - 2; i >= 0; i--) {
    if (perm[i] < perm[i + 1]) {
      for(let j = perm.length - 1; j > i; j--) {
        if (perm[i] < perm[j]) {
          const nextPerm = [...perm];

          [nextPerm[i], nextPerm[j]] = [perm[j], perm[i]];

          const reversed = nextPerm.slice(i + 1).reverse();
          nextPerm.splice(i + 1, reversed.length, ...reversed);

          return nextPerm;
        }
      }
    }
  }
}
*/