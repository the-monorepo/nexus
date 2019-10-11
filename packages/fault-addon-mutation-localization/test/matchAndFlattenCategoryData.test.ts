import { matchAndFlattenCategoryData } from '../src/index';
describe(matchAndFlattenCategoryData.name, () => {
  it('empty array', () => {
    expect(matchAndFlattenCategoryData('', [])).to.deep.equal([]);
  });
  it('unmatched', () =>{
    expect(matchAndFlattenCategoryData('a', ['b', 'c', 'd'])).to.deep.equal(['b', 'c', 'd']);
  })
  it('flat array', () => {
    expect(matchAndFlattenCategoryData('b', ['a', 'b', 'c'])).to.deep.equal(['a', 'c']);
  });
  it('with nested array', () => {
    expect(matchAndFlattenCategoryData('b', [['a', 'b', '2', '1'], ['c', 'd', 'e']])).to.deep.equal(['c', 'd', 'e', 'a', '2', '1']);
  });
  it('with double nested array', () => {
    expect(matchAndFlattenCategoryData('1', [['a', 'b'], ['c', ['1', '2'], 'd']])).to.deep.equal(['a', 'b', 'c', 'd', '2']);
  })
});