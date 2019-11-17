export const lcsLength = (s, t) => {
  const dp = [];
  for(let i = 0; i < s.length; i++) {
    const initialize = [];
    for(let j = 0; j < t.length; j++) {
      initialize[j] = 0;
    }
    dp[i] = initialize;
  }

  for(let i = 0; i < s.length; i++) {
    for(let j = 0; j < t.length; j++) {
      if(s[i] === t[j]) {
        dp[i][j] = i > 0 && j > 0 ? dp[i - 1][j - 1] + 1 : 1;
      }
    }
  }

  return Math.max(...dp.flat(), 0);
}

/*
export const lcsLength = (s, t) => {
  const dp = [];
  for(let i = 0; i < s.length; i++) {
    const initialize = [];
    for(let j = 0; j < t.length; j++) {
      initialize[j] = 0;
    }
    dp[i] = initialize;
  }

  for(let i = 0; i < s.length; i++) {
    for(let j = 0; j < t.length; j++) {
      if(s[i] === t[j]) {
        dp[i][j] = i > 0 && j > 0 ? dp[i - 1][j - 1] + 1 : 1;
      }
    }
  }
  
  return Math.max(...dp.flat(), 0);
}
*/