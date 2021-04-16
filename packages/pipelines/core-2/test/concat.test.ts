import { concat, of, arrayFrom } from '../src/index';

it(concat.name, async () => {
  await expect(arrayFrom(concat(of(1, 2, 3), of('a, b, c'), of(4, 5, 6)))).resolves.toEqual([1, 2, 3, 'a', 'b', 'c', 4, 5, 6]);
});
