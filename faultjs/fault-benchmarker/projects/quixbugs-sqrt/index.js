export const sqrt = (x, epsilon) => {
  let approx = x / 2;
  while (Math.abs(x - approx) > epsilon) {
    approx = 0.5 * (approx + x / approx);
  }

  return approx;
};

/*
export const sqrt = (x, epsilon) => {
  let approx = x / 2;
  while (Math.abs(x - approx ** 2) > epsilon) {
    approx = 0.5 * (approx + x / approx);
  }

  return approx;
};
*/