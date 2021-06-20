export interface Cache<K, V> extends Pick<Map<K, V>, 'set' | 'get'> {};
export interface CacheConstructor<K, V> {
  new(): Cache<K, V>
};

type None = {
  isNone: true;
  value: undefined;
};

type Some<T> = {
  isNone: false;
  value: T;
};

type Option<T> = None | Some<T>;

type Node<K, T> = {
  cache: Cache<K, Node<K, T>> | undefined;
  value: Option<T>;
};

type ItemOfArray<T> = T extends Array<infer K> ? K : never;

const memoize = <A extends any[], R>(fn: (...args: A) => R, ConstructorForCache: CacheConstructor<any, any> = Map): ((...args: A) => R) => {
  const rootNode: Node<ItemOfArray<A>, R> =  {
    cache: undefined,
    value: {
      isNone: true,
      value: undefined,
    }
  };

  const memoized = (...args: A): R => {
    let current: Node<ItemOfArray<A>, R> = rootNode;
    let i = 0;
    while (i < args.length) {
      const key = args[i];

      if (current.cache === undefined) {
        current.cache = new ConstructorForCache();
      }

      const nextNode = (() => {
        const maybeNextNode = current.cache.get(key);

        if (maybeNextNode !== undefined) {
          return maybeNextNode;
        }

        const newNode: Node<ItemOfArray<A>, R> = {
          cache: undefined,
          value: {
            isNone: true,
            value: undefined,
          }
        };
        current.cache.set(key, newNode);

        return newNode;
      })();

      current = nextNode;
      i++;
    }

    if (current.value.isNone) {
      current.value = {
        isNone: false,
        value: fn(...args),
      };
    }

    return current.value.value;
  };

  return memoized;
};

export default memoize;
