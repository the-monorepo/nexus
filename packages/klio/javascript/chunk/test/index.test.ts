import chunk from '../src/index.ts';
import expect from 'expect';

it(chunk.name, () => {
  expect([...chunk([1, 2, 3, 4, 5, 6, 7], 2)]).toEqual([[1, 2], [3, 4], [5, 6], [7]]);
});
