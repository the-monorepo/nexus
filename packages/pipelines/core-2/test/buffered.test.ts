import { bufferred, arrayFrom } from '../src/index';
import { countToThree } from './test-iterables';

it(bufferred.name, async () => {
  const count = countToThree();

  const buffer = bufferred(count);

  await new Promise((resolve) => setTimeout(resolve, 0));

  await expect(count.next()).resolves.toEqual({ value: undefined, done: true });

  await expect(arrayFrom(buffer)).resolves.toEqual(await arrayFrom(countToThree()));
});
