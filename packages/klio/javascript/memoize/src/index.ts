import { failure, ok, isFailure, Result } from '@resultful/result';

export type Cache<K, V> = Pick<Map<K, V>, 'set' | 'get'>;
export type CacheConstructor<K, V> = {
  new (): Cache<K, V>;
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

const memoize = <A extends any[], R>(
  fn: (...args: A) => R,
  ConstructorForCache: CacheConstructor<any, any> = Map,
): ((...args: A) => R) => {
  const rootNode: Node<ItemOfArray<A>, Result<R, any>> = {
    cache: undefined,
    value: {
      isNone: true,
      value: undefined,
    },
  };

  const memoized = (...args: A): R => {
    let current: Node<ItemOfArray<A>, Result<R, any>> = rootNode;
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

        const newNode: Node<ItemOfArray<A>, Result<R, any>> = {
          cache: undefined,
          value: {
            isNone: true,
            value: undefined,
          },
        };
        current.cache.set(key, newNode);

        return newNode;
      })();

      current = nextNode;
      i++;
    }

    if (current.value.isNone) {
      const result = (() => {
        try {
          const value = fn(...args);
          return ok(value);
        } catch (err) {
          return failure(err);
        }
      })();
      current.value = {
        isNone: false,
        value: result,
      };
    }

    if (isFailure(current.value.value)) {
      throw current.value.value.failure;
    }

    return current.value.value.ok;
  };

  return memoized;
};

export default memoize;
