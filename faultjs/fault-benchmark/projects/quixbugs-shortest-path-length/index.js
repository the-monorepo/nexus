export const shortestPathLength = (lengthByEdge, startNode, goalNode) => {
  const unvisitedNodes = new Map();
  const visitedNodes = new Set();

  unvisitedNodes.set(startNode, 0);

  while(unvisitedNodes.size > 0) {
    let minNode = undefined;
    let minDistance = Number.POSITIVE_INFINITY;
    for (const [node, distance] of unvisitedNodes) {
      if (distance < minDistance) {
          minDistance = distance;
          minNode = node;
      }
    }

    unvisitedNodes.delete(minNode);

    if (minNode === goalNode) {
      return minDistance;
    }
    visitedNodes.add(minNode);

    for(const nextNode of minNode.successors) {
      if(visitedNodes.has(nextNode)) {
        continue;
      }

      if(!unvisitedNodes.has(nextNode)) {
        unvisitedNodes.set(nextNode, Number.POSITIVE_INFINITY);
      }
      
      unvisitedNodes.set(nextNode, Math.min(
        unvisitedNodes.get(nextNode),
        unvisitedNodes.get(nextNode) + lengthByEdge.get(`${minNode.id},${nextNode.id}`)
      ));
    }
  }

  return Number.POSITIVE_INFINITY;
}

/*
export const shortestPathLength = (lengthByEdge, startNode, goalNode) => {
  const unvisitedNodes = new Map();
  const visitedNodes = new Set();

  unvisitedNodes.set(startNode, 0);

  while(unvisitedNodes.size > 0) {
    let minNode = undefined;
    let minDistance = Number.POSITIVE_INFINITY;
    for (const [node, distance] of unvisitedNodes) {
      if (distance < minDistance) {
          minDistance = distance;
          minNode = node;
      }
    }

    unvisitedNodes.delete(minNode);

    if (minNode === goalNode) {
      return minDistance;
    }
    visitedNodes.add(minNode);

    for(const nextNode of minNode.successors) {
      if(visitedNodes.has(nextNode)) {
        continue;
      }

      if(!unvisitedNodes.has(nextNode)) {
        unvisitedNodes.set(nextNode, Number.POSITIVE_INFINITY);
      }
      
      unvisitedNodes.set(nextNode, Math.min(
        unvisitedNodes.get(nextNode),
        minDistance + lengthByEdge.get(`${minNode.id},${nextNode.id}`)
      ))
    }
  }

  return Number.POSITIVE_INFINITY;
}
*/