import { filterVariantDuplicates } from '../src/index';
it('filterVariantDuplicates', () => {
  expect(filterVariantDuplicates(['a', 'b', 'c', 'c', 'b', 'a'])).to.deep.equal(['c', 'b', 'a']);
})