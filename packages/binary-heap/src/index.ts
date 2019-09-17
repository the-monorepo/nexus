export type CompareFn<T> = (a: T, b: T) => number;
export const parentIndex = (index: number) => (Math.trunc((index - 1) / 2))
export const leftIndex = (index: number) => index * 2 + 1;
export const rightIndex = (index: number) => index * 2 + 2;
export const swap = <T>(arr: T[], i1: number, i2: number) => {
  const temp = arr[i1];
  arr[i1] = arr[i2];
  arr[i2] = temp;
}

export const push = <T>(arr: T[], locations: Map<T, number>, compareFn: CompareFn<T>, ...items: T[]) => {
  for(const item of items) {
    const updateIndex = arr.length;
    arr[updateIndex] = item;
    locations.set(item, updateIndex);
    checkSwapWithParent(arr, locations, compareFn, updateIndex);
  }
}

export const pop = <T>(arr: T[], locations: Map<T, number>, compareFn: CompareFn<T>) => {
  if (arr.length <= 0) {
    return undefined;
  }
  const index = 0;
  swap(arr, index, arr.length - 1);
  const poppedItem = arr.pop()!;
  locations.delete(poppedItem);
  checkSwapWithChildren(arr, locations, compareFn, index);
  return poppedItem;
}

export const deleteIndex = <T>(arr: T[], locations: Map<T, number>, compareFn: CompareFn<T>, index: number) => {
  if (arr.length <= 0) {
    return undefined;
  }
  swap(arr, index, arr.length - 1);
  const poppedItem = arr.pop()!;
  locations.delete(poppedItem);
  updateIndex(arr, locations, compareFn, index);
  return poppedItem;
}

export const deleteItem = <T>(arr: T[], locations: Map<T, number>, compareFn: CompareFn<T>, item: T) => {
  deleteIndex(arr, locations, compareFn, locations.get(item)!);
}

/**
 * @returns true if swapped, false if not
 */
export const checkSwapWithParent = <T>(arr: T[], locations: Map<T, number>, compareFn: CompareFn<T>, index: number): boolean => {
  if (index <= 0) {
    return false;
  }

  const parentI = parentIndex(index);
  const parentComparison = compareFn(arr[index], arr[parentI]);
  if (parentComparison < 0) {
    locations.set(arr[parentI], index);
    swap(arr, index, parentI);
    checkSwapWithParent(arr, locations, compareFn, parentI);
    return true;
  } else {
    locations.set(arr[index], index);
  }

  return false;
}

export const checkSwapWithChildren = <T>(arr: T[], locations: Map<T, number>, compareFn: CompareFn<T>, index: number) => {
  const rightI = rightIndex(index);
  const leftI = leftIndex(index);

  const rightIsCandidate = rightI < arr.length && compareFn(arr[index], arr[rightI]) > 0;
  const leftIsCandidate = leftI < arr.length && compareFn(arr[index], arr[leftI]) > 0;

  if (leftIsCandidate && rightIsCandidate) {
    const swappedIndex = compareFn(arr[leftI], arr[rightI]) <= 0 ? leftI : rightI
    locations.set(arr[swappedIndex], index);
    swap(arr, index,  swappedIndex);
    checkSwapWithChildren(arr, locations, compareFn, swappedIndex);
  } else if (leftIsCandidate) {
    locations.set(arr[leftI], index);
    swap(arr, index, leftI);
    checkSwapWithChildren(arr, locations, compareFn, leftI);
  } else if (rightIsCandidate) {
    locations.set(arr[rightI], index);
    swap(arr, index, rightI);
    checkSwapWithChildren(arr, locations, compareFn, rightI);
  } else {
    locations.set(arr[index], index);
  }
}

export const updateIndex = <T>(arr: T[], locations: Map<T, number>, compareFn: CompareFn<T>, index: number) => {
  const swappedWithParent = checkSwapWithParent(arr, locations, compareFn, index);
  if (swappedWithParent) {
    return;
  }
  checkSwapWithChildren(arr, locations, compareFn, index);
}

export const update = <T>(arr: T[], locations: Map<T, number>, compareFn: CompareFn<T>, item: T) => {
  return updateIndex(arr, locations, compareFn, locations.get(item)!);
};

/**
 * Attempts to mimic the functionality of Array.prototype.sort
 */
export const defaultCompareFn = (a: any, b: any) => {
  const aStr = `${a}`;
  const bStr = `${b}`;

  let aI = 0;
  let bI = 0;
  while(aI < aStr.length && bI < bStr.length) {
    const comparison = aStr.charCodeAt(aI) - bStr.charCodeAt(bI);
    if (comparison !== 0) {
      return comparison;
    }
    aI++;
    bI++;
  }

  return aStr.length - bStr.length;
};
export class Heap<T> implements Iterable<T> {
  private readonly arr: T[] = [];
  private readonly locations: Map<T, number> = new Map();
  constructor(private readonly compareFn: CompareFn<T> = defaultCompareFn, initial: Iterable<T> = []) {
    this.push(...initial);
  }

  push(...item: T[]) {
    return push(this.arr, this.locations, this.compareFn, ...item);
  }

  updateIndex(index: number) {
    return updateIndex(this.arr, this.locations, this.compareFn, index);
  }

  update(item: T) {
    return update(this.arr, this.locations, this.compareFn, item)
  }

  pop() {
    return pop(this.arr, this.locations, this.compareFn);
  }

  has(item: T) {
    return this.locations.has(item);
  }

  position(item: T) {
    return this.locations.get(item);
  }

  delete(item: T) {
    return deleteItem(this.arr, this.locations, this.compareFn, item);
  }

  deleteIndex(index: number) {
    return deleteIndex(this.arr, this.locations, this.compareFn, index);
  }

  peek() {
    return this.arr[0];
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