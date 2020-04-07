export const RESPECT_BOUNDARIES_ATTRIBUTE = 'respect-boundaries';

export const findParentProvider = (node: Node, providerSet: Set<any>, respectBoundaries: boolean): any | null => {
  let current: Node | null = node;

  while (current !== null) {
    if (providerSet.has(current)) {
      return current;
    } else if (current instanceof ShadowRoot) {
      if(!respectBoundaries) {
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

export const createContext = (contextName?: string) => {
  // TODO: Could consider reworking this to use a data structure that would provider quicker lookups of which provider to use
  const providerSet: Set<any> = new Set();

  const PROVIDER_VALUE = Symbol(`${contextName}-provider-value`);
  const PROVIDER = Symbol(`${contextName}-provider`);

  const consumerDecorator = <T>(target) => {
    const consumerValueSymbol = Symbol(`${contextName}-consumer-value`);
    const consumerDefaultSymbol = Symbol(`${contextName}-consumer-value`);
    console.log('consumerStuff', target);
    return {
      ...target,
      key: consumerDefaultSymbol,
      extras: [{
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
        kind: 'field',
        key: consumerValueSymbol,
        placement: 'own',
        initializer: function() {
          return this[consumerDefaultSymbol];
        },
        descriptor: {
          configurable: true,
          writable: false,
          enumerable: false,
        },
      },
      {
        kind: 'method',
        key: target.key,
        placement: 'prototype',
        descriptor: {
          get: function() {
            return this[PROVIDER] !== null ? this[consumerValueSymbol] : this[consumerDefaultSymbol];
          },
        }
      }],
      finisher: (clazz) => {
        return class Consumer extends clazz { 
          connectedCallback() {
            if (this.isConnected) {
              this[PROVIDER] = findParentProvider(this.parentNode, providerSet, false);
            }
            super.connectedCallback();
          }

          disconnectedCallback() {
            this[PROVIDER] = null;
            super.disconnectedCallback();
          }
        }
      }
    }
  };

  const providerDecorator = (target) => {
    const symbol = Symbol(`${contextName}-alias-provider-value`);
    return {
      ...target,
      key: symbol,
      extras: [{
        kind: 'method',
        key: target.key,
        placement: 'prototype',
        descriptor: {
          get: function() {
            return this[symbol];
          },
          set: function(value) {
            this[symbol] = value;
          }
        }
      }, {
        kind: 'method',
        key: PROVIDER_VALUE,
        placement: 'prototype',
        descriptor: {
          get: function() {
            return this[target.key];
          },
          set: function(value) {
            this[target.key] = value;
          },
        }
      }],
      finisher: (clazz) => {
        return class Provider extends clazz {
          connectedCallback() {
            providerSet.add(this);
            super.connectedCallback();
          }
          disconnectedCallback() {
            providerSet.delete(this);
            super.disconnectedCallback();
          }
        }
      }
    }
  };

  return {
    consumer: consumerDecorator,
    provider: providerDecorator,
  }
};
