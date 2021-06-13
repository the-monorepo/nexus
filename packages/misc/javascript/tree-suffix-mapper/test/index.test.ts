import {
  matchSuffix,
  createSuffixRoot,
  RetrievalObject,
  SuffixNode,
} from '../src/index.ts';

type TestNode = {
  key: string;
  value: number;
  children: TestNode[];
};

const node = (key: string, value: number, ...children: TestNode[]): TestNode => ({
  key,
  value,
  children,
});

const suffixNode = (
  value: number | undefined,
  ...valueSuffixPairs: [string, SuffixNode<string, number>][]
): SuffixNode<string, number> => ({
  value,
  suffixes: new Map(valueSuffixPairs),
});

const keySuffixNodePair = (
  key: string,
  value: number | undefined,
  ...valueSuffixPairs: [string, SuffixNode<string, number>][]
): [string, SuffixNode<string, number>] => [key, suffixNode(value, ...valueSuffixPairs)];

const testRetrievalObject: RetrievalObject<TestNode, string, number> = {
  key: (node) => node.key,
  children: (node) => node.children,
  value: (node) => node.value,
};

const testTrees = [
  node('a', 0, node('b', undefined, node('c', 2), node('d', 3))),
  node('c', 4),
];

const expectedSuffixMap: SuffixNode<string, number> = suffixNode(
  undefined,
  keySuffixNodePair('a', 0),
  keySuffixNodePair('c', 4, keySuffixNodePair('b', undefined, keySuffixNodePair('a', 2))),
  keySuffixNodePair(
    'd',
    undefined,
    keySuffixNodePair('b', undefined, keySuffixNodePair('a', 3)),
  ),
);

describe('tree-suffix-mapper', () => {
  it('createSuffixMap', () => {
    const suffixMap = createSuffixRoot(testRetrievalObject, ...testTrees);
    expect(suffixMap).toEqual(expectedSuffixMap);
  });

  it('matchSuffix', () => {
    expect(
      expectedSuffixMap.suffixes.get('c').suffixes.get('b').suffixes.get('a').value,
    ).toBe(2);
    expect(matchSuffix(expectedSuffixMap, ['a', 'b', 'c'].reverse())).toBe(2);
  });
});
