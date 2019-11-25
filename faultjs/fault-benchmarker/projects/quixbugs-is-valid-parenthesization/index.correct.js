export const isValidParaenthesization = (parens) => {
  let depth = 0;
  for(const paren of parens) {
    if(paren === '(') {
      depth++;
    } else {
      depth--;
      if(depth < 0) {
        return false;
      }
    }
  }
  return depth === 0;
};

/*
export const isValidParaenthesization = (parens) => {
  let depth = 0;
  for(const paren of parens) {
    if(parent === '(') {
      depth++;
    } else {
      depth--;
      if(depth < 0) {
        return false;
      }
    }
  }
  return depth === 0;
};
*/