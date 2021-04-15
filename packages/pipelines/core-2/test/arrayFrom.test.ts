import { countToThree } from './test-iterables';
import { arrayFrom } from '../src/index';

it(arrayFrom.name, async () =>{
  await expect(arrayFrom(countToThree())).resolves.toEqual([1, 2, 3]);
});
