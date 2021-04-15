import { countToThree } from './test-iterables';
import { slice, arrayFrom } from '../src/index';

describe(slice.name, () => {
  it('slice, no start/end', async () =>
    await expect(arrayFrom(slice(countToThree()))).resolves.toEqual(
      await arrayFrom(countToThree()),
    ));
  it('slice, start, no end', async () =>
    await expect(arrayFrom(slice(countToThree(), 1))).resolves.toEqual([2, 3]));
  it('slice, start, end', async () =>
    await expect(arrayFrom(slice(countToThree(), 1, 2))).resolves.toEqual([2]));
  it('slice, no start, end', async () =>
    await expect(arrayFrom(slice(countToThree(), undefined, 2))).resolves.toEqual([
      1,
      2,
    ]));
});
