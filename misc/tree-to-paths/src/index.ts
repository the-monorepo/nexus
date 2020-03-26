

export type GetChildren<T> = (node: T) => T[];

function* yieldTreePaths<T>(current: T[], root: T, getChildren: GetChildren<T>): Generator<T[]> {
  const children = getChildren(root);
  const extendedPath = [...current, root];
  if (children.length <= 0) {
    yield extendedPath;
  } else {
    for (const child of children) {
      yield* yieldTreePaths(extendedPath, child, getChildren);
    }  
  }
}

export const treeToPaths = <T>(root: T, getChildren: GetChildren<T>): Generator<T[]> => yieldTreePaths([], root, getChildren);
