const operators = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
};

export const rpnEval = (tokens) => {
  const stack = [];

  for (const token of tokens) {
    if(typeof token === 'number') {
      stack.push(token);
    } else {
      const a = stack.pop();
      const b = stack.pop();
      stack.push(operators[token](a, b));
    }
  }

  return stack.pop();
}

/*
const operators = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
};

export const rpnEval = (tokens) => {
  const stack = [];

  for (const token of tokens) {
    if(typeof token === 'number') {
      stack.push(token);
    } else {
      const a = stack.pop();
      const b = stack.pop();
      stack.push(operators[token](b, a));
    }
  }

  return stack.pop();
}
*/