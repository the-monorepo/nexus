export const topologicalOrdering = (nodes) => {
  const orderedNodes = nodes.filter(node => node.incomingNodes.length <= 0);
  const orderedNodesSet = new Set(orderedNodes);
  for(const node of orderedNodes) {
    for(const nextNode of node.outgoingNodes) {
      const orderedNodesIsSuperset = nextNode.outgoingNodes.every(incomingNode => orderedNodesSet.has(incomingNode));
      if (orderedNodesIsSuperset && !orderedNodesSet.has(nextNode)) {
        orderedNodes.push(nextNode);
        orderedNodesSet.add(nextNode);
      }
    }
  }

  return orderedNodes;
}
