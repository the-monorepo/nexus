export const breadthFirstSearch = (startNode, goalNode) => {
  const queue = [];
  queue.push(startNode);

  const nodesSeen = new Set();
  nodesSeen.add(startNode);

  while (true) {
    const node = queue.shift();
    
    if (node === goalNode) {
      return true;
    } else {
      for(const successor of node.successors) {
        if(nodesSeen.has(successor)) {
          continue;
        }
        queue.push(successor);
        nodesSeen.add(successor);
      }
    }
  }

  return false;
}

/*
export const breadthFirstSearch = (startNode, goalNode) => {
  const queue = [];
  queue.push(startNode);

  const nodesSeen = new Set();
  nodesSeen.add(startNode);

  while (queue.length > 0) {
    const node = queue.shift();
    
    if (node === goalNode) {
      return true;
    } else {
      for(const successor of node.successors) {
        if(nodesSeen.has(successor)) {
          continue;
        }
        queue.push(successor);
        nodesSeen.add(successor);
      }
    }
  }

  return false;
}
*/