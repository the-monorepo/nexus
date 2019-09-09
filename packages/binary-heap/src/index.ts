export type CompareFn<T> = (a: T, b: T) => number;
export const parentIndex = (index: number) => (Math.trunc((index - 1) / 2))
export const leftIndex = (index: number) => index * 2 + 1;
export const rightIndex = (index: number) => index * 2 + 2;
export const swap = <T>(arr: T[], i1: number, i2: number) => {
  const temp = arr[i1];
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
  checkSwapWithChildren(arr, compareFn, index);
  return poppedItem;
}

/**
 * @returns true if swapped, false if not
 */
export const checkSwapWithParent = <T>(arr: T[], compareFn: CompareFn<T>, index: number): boolean => {
  if (index <= 0) {
    return false;
  }

  const parentI = parentIndex(index);
  const parentComparison = compareFn(arr[index], arr[parentI]);
  if (parentComparison < 0) {
    swap(arr, index, parentI);
    checkSwapWithParent(arr, compareFn, parentI);
    return true;
  }

  return false;
}

export const checkSwapWithChildren = <T>(arr: T[], compareFn: CompareFn<T>, index: number) => {
  const item = arr[index];

  const rightI = rightIndex(index);
  const leftI = leftIndex(index);

  const rightIsCandidate = rightI < arr.length && compareFn(item, arr[rightI]) > 0;
  const leftIsCandidate = leftI < arr.length && compareFn(item, arr[leftI]) > 0;

  // TODO: If you swap with a child, the new parent only needs to check against the child that wasn't swapped
  if (leftIsCandidate && rightIsCandidate) {
    const swappedIndex = compareFn(arr[leftI], arr[rightI]) <= 0 ? leftI : rightI
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

/**
 * Attempts to mimic the functionality of Array.prototype.sort
 */
export const defaultSortFn = (a: any, b: any) => {
  const aStr = `${a}`;
  const bStr = `${b}`;

  let aI = 0;
  let bI = 0;
  while(aI < aStr.length && bI < bStr.length) {
    const comparison = aStr.charCodeAt(aI) - bStr.charCodeAt(bI);
    if (comparison !== 0) {
      return comparison;
    }
  }

  return aStr.length - bStr.length;
};
export class Heap<T> implements Iterable<T> {
  private readonly arr: T[] = [];
  constructor(private readonly compareFn: CompareFn<T> = defaultSortFn, initial: Iterable<T> = []) {
    this.push(...initial);
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

  get length() {
    return this.arr.length;
  }

  clone(): Heap<T> {
    const clonedHeap = new Heap(this.compareFn);
    clonedHeap.arr.push(...this.arr);
    return clonedHeap;
  }

  unsortedIterator(): IterableIterator<T> {
    return this.arr[Symbol.iterator]();
  }

  *[Symbol.iterator](): IterableIterator<T>{
    const clonedHeap = this.clone();
    while(clonedHeap.length > 0) {
      yield clonedHeap.pop()!;
    }
  }
}

export default Heap;