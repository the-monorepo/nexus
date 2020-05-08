export const knapsack = (capacity, items) => {
  const memo = [];

  for(let i = 0; i <= items.length; i++) {
    const arr = [];
    for(let j = 0; j <= capacity; j++) {
      arr[j] = 0;
    }
    memo[i] = arr;
  }

  for(let i = 1; i <= items.length; i++) {
    const [weight, value] = items[i - 1];

    for (let j = 1; j <= capacity; j++) {
      memo[i][j] = memo[i - 1][j];

      if (weight < j) {
        memo[i][j] = Math.max(
          memo[i][j],
          value + memo[i - 1][j - weight]
        );
      }
    }
  }

  return memo[items.length][capacity];
}

/*
export const knapsack = (capacity, items) => {
  const memo = [];
  for(let i = 0; i <= items.length; i++) {
    const arr = [];
    for(let j = 0; j <= capacity; j++) {
      arr[j] = 0;
    }
    memo[i] = arr;
  }
  for(let i = 1; i <= items.length; i++) {
    const [weight, value] = items[i - 1];
    
    for (let j = 1; j <= capacity; j++) {
      memo[i][j] = memo[i - 1][j];
      if (weight <= j) {
        memo[i][j] = Math.max(
          memo[i][j],
          value + memo[i - 1][j - weight]
        );
      }
    }
  }
  return memo[items.length][capacity];
}
*/