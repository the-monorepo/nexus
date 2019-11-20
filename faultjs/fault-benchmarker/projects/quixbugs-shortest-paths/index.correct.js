export const shortestPaths = (source, weightByEdge) => {
  const weightByNode = new Map();
  for(const edge of weightByEdge.keys()) {
    weightByNode.set(edge[0], Number.POSITIVE_INFINITY);
    weightByNode.set(edge[1], Number.POSITIVE_INFINITY);
  }

  weightByNode.set(source, 0);
  for(let i = 0; i < weightByNode.size; i++) {
    for(const edge of weightByEdge.keys()) {
      const updateWeight = Math.min(
        weightByNode.get(edge[0])
          + weightByEdge.get(edge),
        weightByNode.get(edge[1])
      );
      weightByNode.set(edge[1], updateWeight);
    }
  }

  return weightByNode;
}

/*
export const shortestPaths = (source, weightByEdge) => {
  const weightByNode = new Map();
  for(const edge of weightByEdge.keys()) {
    weightByNode.set(edge[0], Number.POSITIVE_INFINITY);
    weightByNode.set(edge[1], Number.POSITIVE_INFINITY);
  }

  weightByNode.set(source, 0);
  for(let i = 0; i < weightByNode.size; i++) {
    for(const edge of weightByEdge.keys()) {
      const updateWeight = Math.min(
        weightByNode.get(edge[0])
          + weightByEdge.get(edge),
        weightByNode.get(edge[1])
      );
      weightByNode.set(edge[1], updateWeight);
    }
  }

  return weightByNode;
}
*/