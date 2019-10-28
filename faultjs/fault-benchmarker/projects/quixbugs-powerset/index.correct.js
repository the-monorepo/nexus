export function powerset(arr) {
  if (arr.length > 0) {
    const [first, ...rest] = arr;
    const restSubsets = powerset(rest);
    return restSubsets.concat(restSubsets.map(subset => [first].concat(subset)));
  } else {
    return [[]];
  }
}
/*
Power Set

Input:
arr: A list

Precondition:
arr has no duplicate elements

Output:
A list of lists, each representing a different subset of arr. The empty set is always a subset of arr, and arr is always a subset of arr.

Example:
>>> powerset(['a', 'b', 'c'])
[[], ['c'], ['b'], ['b', 'c'], ['a'], ['a', 'c'], ['a', 'b'], ['a', 'b', 'c']]*/
