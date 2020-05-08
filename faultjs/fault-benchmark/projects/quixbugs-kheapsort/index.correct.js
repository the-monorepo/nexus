import Heap from '@pshaw/binary-heap';

export const kheapsort = (arr, k) => {
  const heap = new Heap((a, b) => a - b);
  
  for(const v of arr.slice(0, k)) {
    heap.push(v);
  }

  const output = [];
  for(const x of arr.slice(k)) {
    heap.push(x);
    const popped = heap.pop();
    output.push(popped);
  }

  while(heap.length > 0) {
    output.push(heap.pop());
  }

  return output;
}

/*
import Heap from '@pshaw/binary-heap';

export const kheapsort = (arr, k) => {
  const heap = new Heap((a, b) => a - b);
  
  for(const v of arr.slice(0, k)) {
    heap.push(v);
  }

  const output = [];
  for(const x of arr.slice(k)) {
    heap.push(x);
    const popped = heap.pop();
    output.push(popped);
  }

  while(heap.length > 0) {
    output.push(heap.pop());
  }

  return output;
}
*/