export type CompareFn<T> = (a: T, b: T) => number;
export const parentIndex = (index: number) => (Math.trunc((index - 1) / 2))
export const leftIndex = (index: number) => index * 2 + 1;
export const rightIndex = (index: number) => index * 2 + 2;
const swap = <T>(arr: T[], i1: number, i2: number) => {
  let temp = arr[i1];
  arr[i1] = arr[i2];
  arr[i2] = temp;
}

export const push = <T>(arr: T[], compareFn: CompareFn<T>, ...items: T[]) => {
  for(const item of items) {
    const updateIndex = arr.length;
    arr[updateIndex] = item;
    checkSwapWithParent(arr, compareFn, updateIndex);
  }
}

export const pop = <T>(arr: T[], compareFn: CompareFn<T>, index: number = 0) => {
  swap(arr, index, arr.length - 1);
  const poppedItem = arr.pop();
  checkSwapWithParent(arr, compareFn, arr.length - 1);
  return poppedItem;
}

/**
 * @returns true if swapped, false if not
 */
export const checkSwapWithParent = <T>(arr: T[], compareFn: CompareFn<T>, index: number): boolean => {
  if (index > 0) {
    const parentI = parentIndex(index);
    const parentComparison = compareFn(arr[index], arr[parentI]);
    if (parentComparison < 0) {
      swap(arr, index, parentI);
      checkSwapWithParent(arr, compareFn, parentI);
      return true;
    }
  }

  return false;
}

export const checkSwapWithChildren = <T>(arr: T[], compareFn: CompareFn<T>, index: number) => {
  const item = arr[index];

  const rightI = rightIndex(index);
  const leftI = leftIndex(index);

  const rightIsCandidate = rightI < arr.length && compareFn(item, arr[rightI]) > 0;
  const leftIsCandidate = leftI < arr.length && compareFn(item, arr[leftI]) > 0;

  if (leftIsCandidate && rightIsCandidate) {
    const swappedIndex = compareFn(arr[leftI], arr[rightI]) >= 0 ? leftI : rightI
    swap(arr, index,  swappedIndex);
    checkSwapWithChildren(arr, compareFn, swappedIndex);
  } else if (leftIsCandidate) {
    swap(arr, index, leftI);
    checkSwapWithChildren(arr, compareFn, leftI);
  } else if (rightIsCandidate) {
    swap(arr, index, rightI);
    checkSwapWithChildren(arr, compareFn, rightI);
  }
}

export const update = <T>(arr: T[], compareFn: CompareFn<T>, index: number) => {
  const swappedWithParent = checkSwapWithParent(arr, compareFn, index);
  if (swappedWithParent) {
    return;
  }
  checkSwapWithChildren(arr, compareFn, index);
}

export class Heap<T> {
  private readonly arr: T[] = [];
  constructor(private readonly compareFn: CompareFn<T> = (a: any, b: any) => a - b, initial: T[] = []) {
    this.arr = [...initial].sort();
  }

  push(...item: T[]) {
    return push(this.arr, this.compareFn, ...item);
  }

  update(index: number) {
    return update(this.arr, this.compareFn, index);
  }

  pop(i?: number) {
    return pop(this.arr, this.compareFn, i);
  }

  splice() {
    this.arr.splice;
  }

  get length() {
    return this.arr.length;
  }

  [Symbol.iterator]() {
    return this.arr[Symbol.iterator]();
  }
}

export default Heap;