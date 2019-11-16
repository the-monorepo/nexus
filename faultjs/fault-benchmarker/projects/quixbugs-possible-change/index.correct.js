export const possibleChange = (coins, total) => {
  if (total === 0) {
    return 1;
  } else if (total < 0 || coins.length <= 0) {
    return 0;
  }

  const [first, ...rest] = coins;
  return possibleChange(coins, total - first) + possibleChange(rest, total);
};

/*
export const possibleChange = (coins, total) => {
  if (total === 0) {
    return 1;
  } else if (total < 0 || coins.length <= 0) {
    return 0;
  }

  const [first, ...rest] = coins;
  return possibleChange(coins, total - first) + possibleChange(rest, total);
};
*/