export type GetChildrenFn<T> = (node: T) => T[];

export type SuffixNode<K, V> = {
  value: V | undefined;
  suffixes: SuffixMap<K, V>;
};

export type SuffixMap<K, V> = Map<K, SuffixNode<K, V>>;

export type GetKeyFn<T, K> = (node: T) => K;

export type GetValueFn<T, V> = (node: T) => V;

export type RetrievalObject<T, K, V> = {
  children: GetChildrenFn<T>;
  key: GetKeyFn<T, K>;
  value: GetValueFn<T, V>;
};

type SuffixPathInfo<K, V> = {
  value: V;
  keys: K[];
};

function* yieldValueKeyPaths<T, K, V>(
  retrievableObject: RetrievalObject<T, K, V>,
  partialPath: K[],
  roots: T[],
): Generator<SuffixPathInfo<K, V>> {
  for (const root of roots) {
    const key = retrievableObject.key(root);
    const value = retrievableObject.value(root);
    const children = retrievableObject.children(root);

    const extendedKeys = [...partialPath, key];

    if (value !== undefined) {
      yield { value, keys: extendedKeys };
    }

    if (children.length > 0) {
      yield* yieldValueKeyPaths(retrievableObject, extendedKeys, children);
    }
  }
}

export const createEmptySuffixNode = <K, V>(): SuffixNode<K, V> => ({
  value: undefined,
  suffixes: new Map(),
});

export const createSuffixRoot = <T, K, V>(
  retrievalObject: RetrievalObject<T, K, V>,
  ...infoList: T[]
): SuffixNode<K, V> => {
  const rootSuffixNode = createEmptySuffixNode<K, V>();

  const paths = [...yieldValueKeyPaths(retrievalObject, [], infoList)];

  for (const path of paths) {
    const { keys, value } = path;

    let currentSuffixNode = rootSuffixNode;
    for (let k = keys.length - 1; k >= 0; k--) {
      const key = keys[k];

      const nextSuffixNode = currentSuffixNode.suffixes.get(key);
      if (nextSuffixNode !== undefined) {
        currentSuffixNode = nextSuffixNode;
      } else {
        const childSuffixNode = createEmptySuffixNode<K, V>();
        currentSuffixNode.suffixes.set(key, childSuffixNode);
        currentSuffixNode = childSuffixNode;
      }
    }

    if (value !== undefined) {
      currentSuffixNode.value = value;
    }
  }

  return rootSuffixNode;
};

export const matchSuffix = <K, V>(
  suffixNode: SuffixNode<K, V>,
  pathKeys: Iterable<K>,
): V | undefined => {
  let currentValue: V | undefined = suffixNode.value;
  let currentSuffixNode: SuffixNode<K, V> | undefined = suffixNode;

  for (const key of pathKeys) {
    currentSuffixNode = currentSuffixNode.suffixes.get(key);
    if (currentSuffixNode === undefined) {
      break;
    }

    if (currentSuffixNode.value !== undefined) {
      currentValue = currentSuffixNode.value;
    }
  }

  return currentValue;
};
