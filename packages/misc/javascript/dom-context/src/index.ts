export const findParentProvider = (
  node: Node,
  providerSet: Set<any>,
  respectBoundaries: boolean,
): any | null => {
  let current: Node | null = node;

  while (current !== null) {
    if (providerSet.has(current)) {
      return current;
    } else if (current instanceof ShadowRoot) {
      if (!respectBoundaries) {
        current = current.host;
      } else {
        break;
      }
    } else if (current instanceof Node) {
      current = current.parentNode;
    } else {
      break;
    }
  }

  return current;
};

const CONNECTED_CALLBACK_FIELD = 'connectedCallback';
const DISCONNECTED_CALLBACK_FIELD = 'disconnectedCallback';

const overrideSuperIfAvailable = (clazz, functionName: string | symbol, extendedFn) => {
  const property = Object.getOwnPropertyDescriptor(clazz.prototype, functionName);

  Object.defineProperty(clazz.prototype, functionName, {
    configurable: true,
    writable: false,
    enumerable: false,
    ...property,
    value:
      property !== undefined
        ? function (...args) {
            extendedFn.call(this, ...args);
            property.value.call(this, ...args);
          }
        : extendedFn,
  });
};

const createContext = (contextName?: string) => {
  // TODO: Could consider reworking this to use a data structure that would provider quicker lookups of which provider to use
  const providerSet: Set<any> = new Set();

  const PROVIDER_VALUE = Symbol(`${contextName}-provider-value`);
  const PROVIDER = Symbol(`${contextName}-provider`);
  const SET_PROVIDER = Symbol(`${contextName}-set-provider`);

  const FIND_PROVIDER = Symbol(`${contextName}-find-consumer`);

  const UPDATE_CONSUMER_PROVIDERS = Symbol(`${contextName}-update-consumer-providers`);

  const CONSUMERS = Symbol(`${contextName}-consumers`);

  const SET_CONSUMER_VALUE = Symbol(`${contextName}-set-consumer-value`);

  const consumerDecorator = (target) => {
    return {
      ...target,
      extras: [
        {
          kind: 'field',
          key: PROVIDER,
          placement: 'own',
          descriptor: {
            configurable: true,
            writable: true,
            enumerable: false,
          },
          initializer: () => null,
        },
        {
          kind: 'method',
          key: SET_PROVIDER,
          placement: 'prototype',
          descriptor: {
            value: function (value) {
              if (value === null) {
                if (this[PROVIDER] !== null) {
                  this[PROVIDER][CONSUMERS].delete(this);
                }
                this[SET_CONSUMER_VALUE](undefined, this[PROVIDER]);
              } else {
                value[CONSUMERS].add(this);
                this[SET_CONSUMER_VALUE](value[PROVIDER_VALUE], this[PROVIDER]);
              }
            },
          },
        },
        {
          kind: 'method',
          key: FIND_PROVIDER,
          placement: 'prototype',
          descriptor: {
            value: function () {
              this[SET_PROVIDER](findParentProvider(this.parentNode, providerSet, false));
            },
          },
        },
        {
          kind: 'method',
          key: SET_CONSUMER_VALUE,
          placement: 'prototype',
          descriptor: {
            value: function (value, hasProvider) {
              return this[target.key](value, hasProvider);
            },
          },
        },
      ],
      finisher: (clazz) => {
        overrideSuperIfAvailable(clazz, CONNECTED_CALLBACK_FIELD, function () {
          if (this.isConnected) {
            this[FIND_PROVIDER]();
          }
        });

        overrideSuperIfAvailable(clazz, DISCONNECTED_CALLBACK_FIELD, function () {
          this[SET_PROVIDER](null);
        });
      },
    };
  };

  const providerDecorator = (target) => {
    const symbol = Symbol(`${contextName}-alias-provider-value`);
    return {
      ...target,
      key: symbol,
      extras: [
        {
          kind: 'field',
          key: CONSUMERS,
          placement: 'own',
          descriptor: { configurable: false, writable: false, enumerable: false },
          initializer: () => new Set(),
        },
        {
          kind: 'method',
          key: target.key,
          placement: 'prototype',
          descriptor: {
            get: function () {
              return this[symbol];
            },
            set: function (value) {
              this[symbol] = value;
              for (const consumer of this[CONSUMERS]) {
                consumer[SET_CONSUMER_VALUE](value, this);
              }
            },
          },
        },
        {
          kind: 'method',
          key: PROVIDER_VALUE,
          placement: 'prototype',
          descriptor: {
            get: function () {
              return this[target.key];
            },
            set: function (value) {
              this[target.key] = value;
            },
          },
        },
      ],
      finisher: (clazz) => {
        overrideSuperIfAvailable(clazz, CONNECTED_CALLBACK_FIELD, function () {
          providerSet.add(this);
          const parentProvider = findParentProvider(this.parentNode, providerSet, false);
          if (parentProvider !== null) {
            parentProvider[UPDATE_CONSUMER_PROVIDERS]();
          }
        });

        overrideSuperIfAvailable(clazz, DISCONNECTED_CALLBACK_FIELD, function () {
          providerSet.delete(this);
          this[UPDATE_CONSUMER_PROVIDERS]();
        });

        Object.defineProperty(clazz.prototype, UPDATE_CONSUMER_PROVIDERS, {
          configurable: true,
          writable: false,
          enumerable: false,
          value: function () {
            for (const consumer of this[CONSUMERS]) {
              consumer[FIND_PROVIDER]();
            }
          },
        });
      },
    };
  };

  return {
    consumer: consumerDecorator,
    provider: providerDecorator,
  };
};

export default createContext;
