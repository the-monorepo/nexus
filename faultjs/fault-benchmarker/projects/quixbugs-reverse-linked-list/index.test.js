import { expect } from 'chai';
import { reverseLinkedList } from './index';

class NodeIterator {
  constructor(node) {
    this.node = node;
  }

  next() {
    if (this.node === undefined) {
      return {
        value: undefined,
        done: true,
      };
    }
    const value = this.node.value;
    this.node = this.node.successor;

    return {
      value,
      done: false
    };
  }
}

class Node {
  constructor(value, successor) {
    this.value = value;
    this.successor = successor;
  }

  [Symbol.iterator]() {
    return new NodeIterator(this);
  }
}

describe('reverseLinkedList', () => {
  it('1', () => {
    const node1 = new Node(1);
    const node2 = new Node(2, node1);
    const node3 = new Node(3, node2);
    const node4 = new Node(4, node3);
    const node5 = new Node(5, node4);
    expect([...reverseLinkedList(node5)]).to.deep.equal([1, 2, 3, 4, 5])
  });

  it('2', () => {
    const node = new Node(0);
    expect([...reverseLinkedList(node)]).to.deep.equal([0]);
  });

  it('3', () => {
    expect(reverseLinkedList(undefined)).to.equal(undefined);
  });
});
