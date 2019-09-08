import Heap from '../src/heap';

describe('heap', () => {
  const testCases: [string, number[]][] = [
    ['already sorted', [1,2,3,4,5]],
    ['already sorted, repeating elements', [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]],
    ['unsorted', [3,2,1,5,6]],
    ['unsorted, repeating elements', [3, 3, 1, 1, 5, 5, 6, 6]],
    ['large, unsorted, negative numbers, repeating elements', [1,2,3,4,12,31,1,-1,3,6,7,2, -40,1,2,2,22,2,1,5,19, -1, -1, -100, -2,-2,-5]]
  ];
  const compareFns: [string, (a, b) => number | undefined][] = [
    ['default', undefined],
    ['reverse', (a, b) => b - a]
  ];
  for(const [name, compareFn] of compareFns) {
    describe(name, () => {
      it('length', () => {
        expect(new Heap(compareFn, [1,2,3,4]).length).to.be(4);
      });

      it('constructed', () => {
        const arr = [4,2,1,-5,3];
        const sorted = [...arr].sort(compareFn);
        const heapArr = [...new Heap(compareFn, arr)];
        expect(heapArr).to.be.deep.equal(sorted);
      });

      describe('push', () => {
        for(const [testName, arr] of testCases) {
          it(testName, () => {
            const sorted = [...arr].sort(compareFn);
            const heap = new Heap(compareFn);
            heap.push(...arr);
            const heapArr = [...heap];
            expect(heapArr).to.be.deep.equal(sorted);
          })
        }
      });

      describe('pop', () => {
        const testSplice = (i: number | undefined) => {
          it(i.toString(), () => {
            const removalArr = [-1,2,3,1,0];
            const sortedArr = [...removalArr].sort(compareFn);
            const heap = new Heap(compareFn, removalArr);
            heap.pop(i);
            sortedArr.splice(i, 1);
          });
        }
        testSplice(undefined);
        for(let i = 0; i < 5; i++) {
          testSplice(i);
        }
      })
    });
  }
});