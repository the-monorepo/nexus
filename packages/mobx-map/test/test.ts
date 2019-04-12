import { isObservableArray, observable, autorun, IObservableArray } from 'mobx';
import map from '../src/index';
let array;
function mapletFunction(v) {
  return v * 2;
}

it('map observable', () => {
  const array: IObservableArray<number> = observable([]);;
  const mapped = map(array, mapletFunction);
  expect(isObservableArray(mapped)).toBe(true);
  autorun(() => expect(mapped).toEqual(array.map(mapletFunction)));
  array.push(1);
  array.push(2);
  array.push(3);
  array[1] = 10;
  array.spliceWithArray(0, 1, [98, 99, 100]);
  array.pop();
  array.replace([1, 4, 8]);
  array.clear();
});

it('map non-observable', () => {
  const array: number[] = [];
  const mapped = map(array, mapletFunction);
  expect(isObservableArray(mapped)).toBe(false);
  array.push(1, 2, 3);
  expect(mapped).toEqual([]);
  const mapped2 = map(array, mapletFunction);
  expect(mapped2).toEqual([2, 4, 6]);
})