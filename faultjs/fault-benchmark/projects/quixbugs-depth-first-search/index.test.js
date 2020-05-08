import { depthFirstSearch } from './index';
import expect from 'expect';

class Node {
  constructor(value, ...successors) {
    this.value = value;
    this.successors = successors;
  }
}

describe('depthFirstSearch', () => {
  it('1', () => {
    const station1 = new Node("Westminster");
    const station2 = new Node("Waterloo", station1);
    const station3 = new Node("Trafalgar Square", station1, station2);
    const station4 = new Node("Canary Wharf", station2, station3);
    const station5 = new Node("London Bridge", station4, station3);
    const station6 = new Node("Tottenham Court Road", station5, station4);
    expect(depthFirstSearch(station6, station1)).toBe(true);  
  })
  
  const nodef = new Node("F");
	const nodee = new Node("E");
	const noded = new Node("D");
	const nodec = new Node("C", nodef);
	const nodeb = new Node("B", nodee);
  const nodea = new Node("A", nodeb, nodec, noded);
  it('2', () => {
    expect(depthFirstSearch(nodea, nodee)).toBe(true);
  });
  it('3', () => {
    expect(depthFirstSearch(nodef, nodee)).toBe(false);
  });
  it('4', () => {
    expect(depthFirstSearch(nodef, nodef)).toBe(true);
  });
  it('5', () => {
    nodee.successors = [nodea]
    expect(depthFirstSearch(nodea, nodef)).toBe(true);
  });
});