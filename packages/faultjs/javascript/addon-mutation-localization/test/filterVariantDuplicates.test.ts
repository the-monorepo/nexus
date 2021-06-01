import { filterVariantDuplicates } from '../src/index.ts';
it('filterVariantDuplicates', () => {
  expect(filterVariantDuplicates(['a', 'b', 'c', 'c', 'b', 'a'])).toEqual([
    'c',
    'b',
    'a',
  ]);
});
