import { countToThree } from './test-utils.ts';
import { arrayFrom } from '../src/index.ts';

it(arrayFrom.name, async () => {
  await expect(arrayFrom(countToThree())).resolves.toEqual([1, 2, 3]);
});
