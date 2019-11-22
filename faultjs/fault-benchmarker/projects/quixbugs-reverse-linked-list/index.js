export const reverseLinkedList = (node) => {
  let prevNode = undefined;

  while (node !== undefined) {
    const nextNode = node.successor;
    node.successor = prevNode;

    node = nextNode;
  }

  return prevNode;
}

/*
export const reverseLinkedList = (node) => {
  let prevNode = undefined;

  while (node !== undefined) {
    const nextNode = node.successor;
    node.successor = prevNode;
    prevNode = node;
    node = nextNode;
  }

  return prevNode;
}
*/