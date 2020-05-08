export const minimumSpanningTree = (weightByEdge) => {
  const groupByNode = new Map();
  const mstEdges = new Set();

  weightByEdge.sort((a, b) => a[2] - b[2])

  for(const edge of weightByEdge) {
    const vertexU = edge[0];
    const vertexV = edge[1];

    if(!groupByNode.has(vertexU)) {
      groupByNode.set(vertexU, new Set([vertexU]));
    }
    if(!groupByNode.has(vertexV)) {
      groupByNode.set(vertexV, new Set([vertexV]));
    }

    if(groupByNode.get(vertexU) !== groupByNode.get(vertexV)) {
      mstEdges.add(edge);
      groupByNode.set(vertexU, groupByNode.get(vertexV));
      for(const node of groupByNode.get(vertexV)) {
        groupByNode.set(node, groupByNode.get(vertexU));
      }
    }
  }
  
  return mstEdges;
}

/*
export const minimumSpanningTree = (weightByEdge) => {
  const groupByNode = new Map();
  const mstEdges = new Set();

  weightByEdge.sort((a, b) => a[2] - b[2])

  for(const edge of weightByEdge) {
    const vertexU = edge[0];
    const vertexV = edge[1];

    if(!groupByNode.has(vertexU)) {
      groupByNode.set(vertexU, new Set([vertexU]));
    }
    if(!groupByNode.has(vertexV)) {
      groupByNode.set(vertexV, new Set([vertexV]));
    }

    if(groupByNode.get(vertexU) !== groupByNode.get(vertexV)) {
      mstEdges.add(edge);
      const vertexUSpan = groupByNode.get(vertexU);
      for(const vertex of groupByNode.get(vertexV)) {
        vertexUSpan.add(vertex);
      }
      for(const node of groupByNode.get(vertexV)) {
        groupByNode.set(node, groupByNode.get(vertexU));
      }
    }
  }
  
  return mstEdges;
}
*/