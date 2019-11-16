export const lis = (arr) => {
  const ends = new Map();
  let longest = 0;
  
  let i = 0;
  for(const val of arr) {
    const prefixLengths = [];
    for(let j = 1; j < longest + 1; j++) {
      if(arr[ends.get(j)] < val) {
        prefixLengths.push(j);
      }
    }

    const length = prefixLengths.length > 0 ? Math.max(...prefixLengths) : 0;

    if((length === longest) || (val < arr[ends.get(length + 1)])) {
      ends.set(length + 1, i);
      longest = length + 1;
    }

    i++;
  }

  return longest;
}

/*
export const lis = (arr) => {
  const ends = new Map();
  let longest = 0;
  
  let i = 0;
  for(const val of arr) {
    const prefixLengths = [];
    for(let j = 1; j < longest + 1; j++) {
      if(arr[ends.get(j)] < val) {
        prefixLengths.push(j);
      }
    }

    const length = prefixLengths.length > 0 ? Math.max(...prefixLengths) : 0;

    if((length === longest) || (val < arr[ends.get(length + 1)])) {
      ends.set(length + 1, i);
      longest = Math.max(longest, length + 1);
    }

    i++;
  }

  return longest;
}
*/