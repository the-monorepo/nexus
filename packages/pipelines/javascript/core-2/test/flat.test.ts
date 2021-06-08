import { threeCountersCountingThreeEach } from './test-utils.ts';
import { map, flat, arrayFrom, of } from '../src/index.ts';

describe(flat.name, () => {
  it(`${threeCountersCountingThreeEach.name} with default depth`, async () => {
    const flattened = flat(threeCountersCountingThreeEach());
    await expect(arrayFrom(flattened)).resolves.toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it(`${threeCountersCountingThreeEach.name} with 0 depth`, async () => {
    const flattened = flat(threeCountersCountingThreeEach(), 0);
    const actualArray = arrayFrom(map(flattened, arrayFrom as any));
    await expect(actualArray).resolves.toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);
  });

  it(`Array of 3 ${threeCountersCountingThreeEach.name} with 2 depth`, async () => {
    const flattened = flat(
      of(
        threeCountersCountingThreeEach(),
        threeCountersCountingThreeEach(),
        threeCountersCountingThreeEach(),
      ),
      2,
    );
    const countToNineArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    await expect(arrayFrom(flattened)).resolves.toEqual([
      ...countToNineArray,
      ...countToNineArray,
      ...countToNineArray,
    ]);
  });
});
