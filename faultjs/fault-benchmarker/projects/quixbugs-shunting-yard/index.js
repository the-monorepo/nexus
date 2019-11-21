export const shuntingYard = (tokens) => {
  const precedence = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };
  
  const rpnTokens = [];
  const opStack = [];

  for(const token of tokens) {
    if(typeof token === 'number'){
      rpnTokens.push(token);
    } else {
      while(opStack.length > 0 && precedence[token] <= precedence[opStack[opStack.length - 1]]) {
        rpnTokens.push(opStack.pop());
      }
    }
  }

  return rpnTokens.concat(opStack.reverse());
}

/*
export const shuntingYard = (tokens) => {
  const precedence = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };
  
  const rpnTokens = [];
  const opStack = [];

  for(const token of tokens) {
    if(typeof token === 'number'){
      rpnTokens.push(token);
    } else {
      while(opStack.length > 0 && precedence[token] <= precedence[opStack[opStack.length - 1]]) {
        rpnTokens.push(opStack.pop());
      }
      opStack.push(token);
    }
  }

  return rpnTokens.concat(opStack.reverse());
}
*/