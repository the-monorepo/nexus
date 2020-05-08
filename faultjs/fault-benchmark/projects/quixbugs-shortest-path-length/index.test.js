import { shortestPathLength } from './index';
import expect from 'expect';

class Node {
  constructor(id, successors = []) {
    this.id = id;
    this.successors = successors;
  }
}

describe('shortestPathLength', () => {
  const lengthByEdge = new Map();

  const node1 = new Node("1");
  const node5 = new Node("5");
  const node4 = new Node("4", [node5]);
  const node3 = new Node("3", [node4]);
  const node2 = new Node("2", [node1, node3, node4]);
  const node0 = new Node("0", [node2, node5]);

  lengthByEdge.set(`${node0.id},${node2.id}`, 3);
  lengthByEdge.set(`${node0.id},${node5.id}`, 10);
  lengthByEdge.set(`${node2.id},${node1.id}`, 1);
  lengthByEdge.set(`${node2.id},${node3.id}`, 2);
  lengthByEdge.set(`${node2.id},${node4.id}`, 4);
  lengthByEdge.set(`${node3.id},${node4.id}`, 1);
  lengthByEdge.set(`${node4.id},${node5.id}`, 1);

  it('1', () => {
    const result = shortestPathLength(lengthByEdge, node0, node1);
    expect(result).toBe(4);
  });

  it('2', () => {
    const result = shortestPathLength(lengthByEdge, node0, node5);
    expect(result).toBe(7);
  });

  it('3', () => {
    const result = shortestPathLength(lengthByEdge, node2, node2);
    expect(result).toBe(0);
  });

  it('4', () => {
    const result = shortestPathLength(lengthByEdge, node1, node5);
    expect(result).toBe(Number.POSITIVE_INFINITY);
  });
});