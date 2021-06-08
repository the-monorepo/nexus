import { leftIndex, parentIndex, rightIndex, swap } from '../src/index.ts';
import Heap from '../src/index.ts';

type ScoreHolder = {
  score: number;
};
describe('heap', () => {
  it('swap', () => {
    const arr = [1, 2, 3];
    swap(arr, 0, 2);
    expect(arr).toEqual([3, 2, 1]);
  });
  it('leftIndex', () => {
    expect(leftIndex(0)).toBe(1);
    expect(leftIndex(1)).toBe(3);
    expect(leftIndex(2)).toBe(5);
    expect(leftIndex(3)).toBe(7);
    expect(leftIndex(4)).toBe(9);
    expect(leftIndex(5)).toBe(11);
    expect(leftIndex(6)).toBe(13);
  });

  it('rightIndex', () => {
    expect(rightIndex(0)).toBe(2);
    expect(rightIndex(1)).toBe(4);
    expect(rightIndex(2)).toBe(6);
    expect(rightIndex(3)).toBe(8);
    expect(rightIndex(4)).toBe(10);
    expect(rightIndex(5)).toBe(12);
    expect(rightIndex(6)).toBe(14);
  });

  it('parentIndex', () => {
    expect(parentIndex(1)).toBe(0);
    expect(parentIndex(2)).toBe(0);
    expect(parentIndex(3)).toBe(1);
    expect(parentIndex(4)).toBe(1);
    expect(parentIndex(5)).toBe(2);
    expect(parentIndex(6)).toBe(2);
  });

  it('empty', () => {
    const heap = new Heap();
    expect(heap.pop()).toBe(undefined);
    expect(heap.length).toBe(0);
  });

  it('has', () => {
    const heap = new Heap(undefined, [1, 2, 3]);
    expect(heap.has(1)).toBe(true);
    expect(heap.has(2)).toBe(true);
    expect(heap.has(3)).toBe(true);
    expect(heap.has(4)).toBe(false);
  });

  it('update & updateIndex + position', () => {
    const compareFn = (a: ScoreHolder, b: ScoreHolder) => a.score - b.score;
    const arr = [
      {
        score: 1,
      },
      {
        score: 2,
      },
      {
        score: 3,
      },
      {
        score: 4,
      },
    ]
      .sort(compareFn)
      .reverse();

    const heap = new Heap(compareFn, arr);
    // Make sure the heap sorts properly
    expect([...heap.sortedIterator()]).toEqual(arr);

    const thirdItem = arr[2];
    // Modifying the 3rd item should break the heap order, it'll need to be swapped all the way to the top
    thirdItem.score = 500;
    arr.sort(compareFn).reverse();
    expect([...heap.sortedIterator()]).not.toEqual(arr);

    // Updating the item should fix the heap order
    heap.update(thirdItem);
    expect([...heap.sortedIterator()]).toEqual(arr);

    // Breaking the first item, will need to be swapped to the bottom
    const firstItem = arr[2];
    firstItem.score = 5000;
    arr.sort(compareFn).reverse();
    heap.update(thirdItem);
    expect([...heap.sortedIterator()]).toEqual(arr);
  });

  const testCases: [string, number[]][] = [
    ['empty', []],
    ['single element', [0]],
    ['already sorted', [0, 1, 2, 3, 4]],
    ['already sorted, repeating elements', [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]],
    ['unsorted, multi-digit', [3, 2, 10, 500, 0, 999, 5]],
    ['unsorted, repeating elements', [3, 3, 1, 1, 5, 5, 0, 0]],
    [
      'large, unsorted, negative numbers, mutli-digit, repeating elements',
      [
        1, 2, 3, 4, 12, 31, 1, -1, 3, 6, 7, 2, -40, 1, 2, 2, 22, 2, 1, 5, 19, -1, -1,
        -100, -2, -2, -5,
      ],
    ],
  ];
  const compareFns: [string, ((a, b) => number) | undefined][] = [
    ['default', undefined],
    ['reverse order', (a, b) => b - a],
  ];
  for (const [name, compareFn] of compareFns) {
    describe(name, () => {
      it('peek and pop', () => {
        const sortedArr = [1, 2, 3, 4, 5];
        const heap = new Heap(compareFn, sortedArr);
        sortedArr.sort(compareFn).reverse();
        while (sortedArr.length > 0) {
          expect(heap.peek()).toBe(sortedArr[0]);
          expect(heap.pop()).toBe(sortedArr.shift());
        }
      });

      it('length', () => {
        expect(new Heap(compareFn, [1, 2, 3, 4]).length).toBe(4);
      });

      describe('constructed', () => {
        const arr = [4, 2, 1, -5, 3];
        const sorted = [...arr].sort(compareFn).reverse();
        const heap = new Heap(compareFn, arr);
        it('spread, sorted', () => {
          expect([...heap.sortedIterator()]).toEqual(sorted);
        });
        it('spread, unsorted', () => {
          expect([...heap]).toEqual(expect.arrayContaining(sorted));
        });
      });

      describe('push and spread', () => {
        for (const [testName, arr] of testCases) {
          it(testName, () => {
            const sorted = [...arr].sort(compareFn).reverse();
            const heap = new Heap(compareFn);
            heap.push(...arr);
            const heapArr = [...heap.sortedIterator()];
            expect(heapArr).toEqual(sorted);
          });
        }
      });
    });
  }
});
