class Node<T> {
  constructor(
    public value: T,
    public next: Node<T> | undefined,
    public previous: Node<T> | undefined,
  ) {}
}

class ReverseIterator<T> implements IterableIterator<T> {
  constructor(private nextNode: Node<T> | undefined) {}

  next(): IteratorResult<T> {
    if (this.nextNode === undefined) {
      return {
        value: undefined,
        done: true,
      };
    }

    const popped = this.nextNode.previous;
    this.nextNode = popped;

    return {
      value: popped.value,
      done: this.nextNode === undefined,
    };
  }

  [Symbol.iterator]() {
    return this;
  }
}

class ForwardIterator<T> implements IterableIterator<T> {
  constructor(private nextNode: Node<T> | undefined) {}

  next(): IteratorResult<T> {
    if (this.nextNode === undefined) {
      return {
        value: undefined,
        done: true,
      };
    }

    const popped = this.nextNode.next;
    this.nextNode = popped;

    return {
      value: popped.value,
      done: this.nextNode === undefined,
    };
  }

  [Symbol.iterator]() {
    return this;
  }
}

export class Deque<T> implements Iterable<T> {
  private headNode: Node<T> | undefined;
  private tailNode: Node<T> | undefined;

  constructor(...values: T[]) {
    this.push(...values);
  }

  pop() {
    if (this.tailNode === undefined) {
      return undefined;
    }
    const tailValue = this.tailNode.value;

    this.tailNode = this.tailNode.previous;
    if (this.tailNode === undefined) {
      this.headNode = undefined;
    }

    return tailValue;
  }

  shift() {
    if (this.headNode === undefined) {
      return undefined;
    }
    const headValue = this.headNode.value;

    this.headNode = this.headNode.next;
    if (this.headNode === undefined) {
      this.tailNode = this.headNode.previous;
    }

    return headValue;
  }

  private singleUnshift(value: T) {
    const newNode = new Node(value, this.headNode, undefined);
    if (this.headNode === undefined) {
      this.headNode = newNode;
      this.tailNode = newNode;
    } else {
      this.headNode.previous = newNode;
      this.headNode = newNode;
    }
  }

  unshift(...values: T[]) {
    for (const value of values) {
      this.singleUnshift(value);
    }
  }

  private singlePush(value: T) {
    const newNode = new Node(value, undefined, this.headNode);
    if (this.headNode === undefined) {
      this.headNode = newNode;
      this.tailNode = newNode;
    } else {
      this.tailNode.next = newNode;
      this.tailNode = newNode;
    }
  }

  push(...values: T[]) {
    for (const value of values) {
      this.singlePush(value);
    }
  }

  get head() {
    if (this.headNode === undefined) {
      return undefined;
    }
    return this.headNode.value;
  }

  get tail() {
    if (this.tailNode === undefined) {
      return undefined;
    }
    return this.tailNode.value;
  }

  [Symbol.iterator](): IterableIterator<T> {
    return new ForwardIterator(this.headNode);
  }

  reverseIterator(): IterableIterator<T> {
    return new ReverseIterator(this.tailNode);
  }
}

export default Deque;
