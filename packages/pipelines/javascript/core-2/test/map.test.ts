import { countToThree } from './test-utils.ts';
import { map, arrayFrom } from '../src/index.ts';

it('1, 2, 3 -> 2, 4, 6', () =>
  expect(arrayFrom(map(countToThree(), (v) => v * 2))).resolves.toEqual([2, 4, 6]));
