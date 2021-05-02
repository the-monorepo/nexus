import {
  matchAndFlattenCategoryData,
  assignmentCategories,
  binaryOperationCategories,
  CategoryData,
} from '../src/index.ts';

const expectCategory = <T>(categories: CategoryData<T>) => {
  return {
    withMatchToPopWith: (value: T, expected: T[]) => {
      const result = matchAndFlattenCategoryData(categories, value);
      try {
        expect(result.slice(result.length - expected.length)).toEqual(expected);
      } catch (err) {
        // TODO: This exists just to make the error easier to read - but it's hacky. Try refactor.
        expect(result).toContain(expected);
      }
    },
  };
};

const binaryCategory = expectCategory(binaryOperationCategories);
describe(matchAndFlattenCategoryData.name, () => {
  it('empty array', () => {
    expect(matchAndFlattenCategoryData([], '')).toEqual([]);
  });
  it('unmatched', () => {
    expect(matchAndFlattenCategoryData(['b', 'c', 'd'], 'a')).toEqual(['b', 'c', 'd']);
  });
  it('flat array', () => {
    expect(matchAndFlattenCategoryData(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });
  it('with nested array', () => {
    expect(
      matchAndFlattenCategoryData(
        [
          ['a', 'b', '2', '1'],
          ['c', 'd', 'e'],
        ],
        'b',
      ),
    ).toEqual(['c', 'd', 'e', 'a', '2', '1']);
  });
  it('with double nested array', () => {
    expect(
      matchAndFlattenCategoryData(
        [
          ['a', 'b'],
          ['c', ['1', '2'], 'd'],
        ],
        '1',
      ),
    ).toEqual(['a', 'b', 'c', 'd', '2']);
    expect(
      matchAndFlattenCategoryData(
        [
          ['a', 'b'],
          ['c', ['1', '2'], 'd'],
        ],
        'd',
      ),
    ).toEqual(['a', 'b', 'c', '1', '2']);
  });
  it('with double nested array 2', () => {
    expect(
      matchAndFlattenCategoryData(
        [
          ['c', ['1', '2'], 'd'],
          ['a', 'b'],
        ],
        '1',
      ),
    ).toEqual(['a', 'b', 'c', 'd', '2']);
  });
  it('with matching elements', () => {
    expect(
      matchAndFlattenCategoryData([['c', ['1', '2'], 'd'], [['1', 'a', 'b']]], '1'),
    ).toEqual(['c', 'd', '2', 'a', 'b']);
  });
  describe('operation categories', () => {
    it('&&', () => {
      binaryCategory.withMatchToPopWith('&&', ['||', '&']);
    });
    it('>', () => {
      binaryCategory.withMatchToPopWith('>', ['<=', '<', '>=']);
    });
    it('+', () => {
      binaryCategory.withMatchToPopWith('+', ['/', '*', '-']);
    });
    it('>>', () => {
      binaryCategory.withMatchToPopWith('>>', ['>>>', '<<']);
    });
    it('||', () => {
      binaryCategory.withMatchToPopWith('||', [
        '>=',
        '>',
        '<=',
        '<',
        '!=',
        '==',
        '!==',
        '===',
        '&&',
        '|',
      ]);
    });
  });
  it('assignment categories', () => {
    expect(matchAndFlattenCategoryData(assignmentCategories, '+=')).toEqual([
      '^=',
      '&=',
      '|=',
      '>>>=',
      '>>=',
      '<<=',
      '/=',
      '*=',
      '-=',
    ]);
    expect(matchAndFlattenCategoryData(assignmentCategories, '>>=')).toEqual([
      '/=',
      '*=',
      '-=',
      '+=',
      '^=',
      '|=',
      '&=',
      '>>>=',
      '<<=',
    ]);
  });
});
