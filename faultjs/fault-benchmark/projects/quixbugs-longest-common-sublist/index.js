export const longestCommonSubsequence = (a, b) => {
  if (a.length <= 0 || b.length <= 0) {
    return '';
  } else if (a[0] === b[0]) {
    return a[0] + longestCommonSubsequence(a.slice(1), b);
  } else {
    const seq1 = longestCommonSubsequence(a, b.slice(1));
    const seq2 = longestCommonSubsequence(a.slice(1), b);
    return seq1.length >= seq2.length ? seq1 : seq2;
  }
}

/*
export const longestCommonSubsequence = (a, b) => {
  if (a.length <= 0 || b.length <= 0) {
    return '';
  } else if (a[0] === b[0]) {
    return a[0] + longestCommonSubsequence(a.slice(1), b.slice(1));
  } else {
    const seq1 = longestCommonSubsequence(a, b.slice(1));
    const seq2 = longestCommonSubsequence(a.slice(1), b);
    return seq1.length >= seq2.length ? seq1 : seq2;
  }
}
*/