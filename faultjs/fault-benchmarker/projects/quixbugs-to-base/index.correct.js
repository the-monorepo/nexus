export const toBase = (num, b) => {
  let result = '';
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  while (num > 0) {
    const i = num  % b;
    num = Math.trunc(num / b);
    result = alphabet[i] + result;
  }
  
  return result;
}

/*
export const toBase = (num, b) => {
  let result = '';
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  while (num > 0) {
    const i = num  % b;
    num = Math.trunc(num / b);
    result = alphabet[i] + result;
  }
  
  return result;
}
*/