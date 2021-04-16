import { countToThree, itPreservesReturnValue } from './test-utils';
import { map, arrayFrom } from '../src/index';

it('1, 2, 3 -> 2, 4, 6', () =>
  expect(arrayFrom(map(countToThree(), (v) => v * 2))).resolves.toEqual([2, 4, 6]));
