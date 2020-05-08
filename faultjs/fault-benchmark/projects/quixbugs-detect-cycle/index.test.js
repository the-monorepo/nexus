import expect from 'expect';
import { detectCycle } from './index';
class Node {
  constructor(value, successor) {
    this.value = value;
    this.successor = successor;
  }
}

describe('detectCycle', () => {
  it('1', () => {
    const node1 = new Node("1");
    const node2 = new Node("2", node1);
    const node3 = new Node("3", node2);
    const node4 = new Node("4", node3);
    const node5 = new Node("5", node4);
    expect(detectCycle(node5)).toBe(false);  
  });

  it('2', () => {
    const node1 = new Node("1");
    const node2 = new Node("2", node1);
    const node3 = new Node("3", node2);
    const node4 = new Node("4", node3);
    const node5 = new Node("5", node4);
    node1.successor = node5;
    expect(detectCycle(node5)).toBe(true);  
  });

  it('3', () => {
    const node1 = new Node("1");
    const node2 = new Node("2", node1);
    const node3 = new Node("3", node2);
    const node4 = new Node("4", node3);
    const node5 = new Node("5", node4);
    node1.successor = node2;
    expect(detectCycle(node2)).toBe(true);  
  });

  it('4', () => {
    const node1 = new Node("1");
    const node2 = new Node("2", node1);
    const node3 = new Node("3", node2);
    const node4 = new Node("4", node3);
    const node5 = new Node("5", node4);
    const node6 = new Node("6");
    const node7 = new Node("7", node6);
    expect(detectCycle(node7)).toBe(false);  
  });

  it('5', () => {
    const node = new Node("0");
    expect(detectCycle(node)).toBe(false);  
  });
});
