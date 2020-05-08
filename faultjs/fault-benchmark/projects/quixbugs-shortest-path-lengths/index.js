export const shortestPathLengths = (numNodes, lengthByEdge) => {
  const lengthByPath = new Map();
  
  for(let i = 0; i < numNodes; i++) {
    for(let j = 0; j < numNodes; j++) {
      const edge = `${i},${j}`;
      if (i === j) {
        lengthByPath.set(edge, 0);
      } else if (lengthByEdge.has(edge)) {
        lengthByPath.set(edge, lengthByEdge.get(edge));
      } else {
        lengthByPath.set(edge, Number.POSITIVE_INFINITY);
      }
    }
  }
  for(let k = 0; k < numNodes; k++) {
    for(let i = 0; i < numNodes; i++) {
      for(let j = 0; j < numNodes; j++) {
        const edge = `${i},${j}`;
        const updateLength = Math.min(
          lengthByPath.get(edge),
          lengthByPath.get(`${i},${k}`) + lengthByPath.get(`${j},${k}`),
        );
        lengthByPath.set(edge, updateLength);
      }
    }
  }

  return lengthByPath;
}

/*
export const shortestPathLengths = (numNodes, lengthByEdge) => {
  const lengthByPath = new Map();
  
  for(let i = 0; i < numNodes; i++) {
    for(let j = 0; j < numNodes; j++) {
      const edge = `${i},${j}`;
      if (i === j) {
        lengthByPath.set(edge, 0);
      } else if (lengthByEdge.has(edge)) {
        lengthByPath.set(edge, lengthByEdge.get(edge));
      } else {
        lengthByPath.set(edge, Number.POSITIVE_INFINITY);
      }
    }
  }
  for(let k = 0; k < numNodes; k++) {
    for(let i = 0; i < numNodes; i++) {
      for(let j = 0; j < numNodes; j++) {
        const edge = `${i},${j}`;
        const updateLength = Math.min(
          lengthByPath.get(edge),
          lengthByPath.get(`${i},${k}`) + lengthByPath.get(`${k},${j}`),
        );
        lengthByPath.set(edge, updateLength);
      }
    }
  }

  return lengthByPath;
}
*/