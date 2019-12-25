import expect from 'expect';
import { breadthFirstSearch } from './index';

class Node {
  constructor(value, ...successors) {
    this.value = value;
    this.successors = successors;
  }
}

describe('kth', () => {
  it('1', () => {
    const station1 = new Node("Westminster");
    const station2 = new Node("Waterloo", station1);
    const station3 = new Node("Trafalgar Square", station1, station2);
    const station4 = new Node("Canary Wharf", station2, station3);
    const station5 = new Node("London Bridge", station4, station3);
    const station6 = new Node("Tottenham Court Road", station5, station4);

    expect(breadthFirstSearch(station6, station1)).toBe(true);
  });

  it('2', () => {
    const nodef = new Node("F");
    const nodee = new Node("E");
    const noded = new Node("D");
    const nodec = new Node("C", nodef);
    const nodeb = new Node("B", nodee);
    const nodea = new Node("A", nodeb, nodec, noded);

    expect(breadthFirstSearch(nodea, nodee)).toBe(true);
    expect(breadthFirstSearch(nodef, nodee)).toBe(false);
    expect(breadthFirstSearch(nodef, nodef)).toBe(true);
  });

  it('3', () => {
    const node1 = new Node("1");
    const node2 = new Node("2");
    const node3 = new Node("3");
    const node4 = new Node("4", node1);
    const node5 = new Node("5", node2);
    const node6 = new Node("6", node5, node4, node3);
    node2.successors = [node6];

    expect(breadthFirstSearch(node6, node1)).toBe(true);
  })
});
