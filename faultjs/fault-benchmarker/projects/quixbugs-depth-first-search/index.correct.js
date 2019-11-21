export const depthFirstSearch = (startNode, goalNode) => {
  const nodesVisited = new Set();
  const search = (node) => {
    if (nodesVisited.has(node)) {
      return false;
    } else if (node === goalNode) {
      return true;
    } else {
      nodesVisited.add(node);
      for (const successorNode of node.successors) {
        if(search(successorNode)) {
          return true;
        }
      }
    }

    return false;
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
      for (const successorNode of node.successors) {
        if(search(successorNode)) {
          return true;
        }
      }
    }

    return false;
  }

  return search(startNode);
}
*/