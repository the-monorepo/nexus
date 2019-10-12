import { matchAndFlattenCategoryData, assignmentCategories, binaryOperationCategories } from '../src/index';
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
    expect(matchAndFlattenCategoryData('d', [['a', 'b'], ['c', ['1', '2'], 'd']])).to.deep.equal(['a', 'b', 'c', '1', '2']);
  });
  it('with double nested array 2', () => {
    expect(matchAndFlattenCategoryData('1', [['c', ['1', '2'], 'd'], ['a', 'b']])).to.deep.equal(['a', 'b', 'c', 'd', '2']);
  });
  it('with matching elements', () => {
    expect(matchAndFlattenCategoryData('1', [['c', ['1', '2'], 'd'], [['1', 'a', 'b']]])).to.deep.equal(['c', 'd', '2', 'a', 'b',]);
  });
  it('operation categories', () => {
    expect(matchAndFlattenCategoryData('||', binaryOperationCategories)).to.deep.equal(['^', '&', '>>>', '>>', '<<<', '<<', '**', '%', '/', '*', '-', '+', '>=', '>', '<=', '<', '!=', '==', '!==', '===', '|', '&&']);
  });
  it('assignment categories', () => {
    expect(matchAndFlattenCategoryData('+=', assignmentCategories)).to.deep.equal(
      ['^=', '&=', '>>=', '|=', '<<=', '/=', '*=', '-=']
    );
    expect(matchAndFlattenCategoryData('>>=', assignmentCategories)).to.deep.equal(
      ['/=', '*=', '-=', '+=', '^=', '|=', '<<=', '&=']
    );
  })
});