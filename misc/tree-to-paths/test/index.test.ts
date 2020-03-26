import { treeToPaths } from '../src/index';

type Node = {
  value: number;
  children: Node[];
};

const tree: Node = {
  value: 1,
  children: [{
    value: 2,
    children: []
  }, {
    value: 3,
    children: [{
      value: 4,
      children: [],
    }, {
      value: 5,
      children: [],
    }]
  }]
}
it('tree-paths', () => {
  const getChildren = (node: Node) => node.children;
  const expected = [
    [1, 2],
    [1, 3, 4],
    [1, 3, 5],
  ];

  const actual = [...treeToPaths(tree, getChildren)]
    .map(path => path.map(node => node.value));

  expect(expected).toEqual(actual);
});