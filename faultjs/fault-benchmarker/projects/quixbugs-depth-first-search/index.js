export const depthFirstSearch = (startNode, goalNode) => {
  const nodesVisited = new Set();
  const search = (node) => {
    if (nodesVisited.has(node)) {
      return false;
    } else if (node === goalNode) {
      return true;
    } else {

      return node.successors.some(successor => search(successor));
    }
  }

  return search(startNode);
}

/*
export const depthFirstSearch = (startNode, goalNode) => {
  const nodesVisited = new Set();
  const search = (node) => {
    if (nodesVisited.has(node)) {
      return false;
    } else if (node === goalNode) {
      return true;
    } else {
      nodesVisited.add(node);
      return node.successors.some(successor => search(successor));
    }
  }

  return search(startNode);
}
*/