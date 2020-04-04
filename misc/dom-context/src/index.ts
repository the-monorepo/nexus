const PROVIDER_TYPE = Symbol('provider-type');
export const RESPECT_BOUNDARIES_ATTRIBUTE = 'respect-boundaries';

export const findParentProvider = <T>(node: Node, providerType: Symbol, respectBoundaries: boolean): ProviderElement<T> | null => {
  let current: Node | null = node;

  while (current !== null) {
    if (current[PROVIDER_TYPE] === providerType) {
      break;
    } else if (current instanceof ShadowRoot && !respectBoundaries) {
      current = current.host;
    } else if (current instanceof Node) {
      current = current.parentNode;
    } else {
      break;
    }
  }

  return current as ProviderElement<T>;
};

abstract class ProviderElement<T> extends HTMLElement {
  private _value: T | undefined = undefined;
  public readonly consumers = new Set();
  constructor(
    private readonly contextSymbol: Symbol
  ) {
    super();
    this.attachShadow({ mode: 'open' })
      .appendChild(document.createElement('slot'));
  }

  connectedCallback() {
    if (this.isConnected) {
      const parentProvider = findParentProvider(this.shadowRoot!, this.contextSymbol, this.respectBoundaries);
      parentProvider
    }
  }

  get respectBoundaries() {
    return this.hasAttribute(RESPECT_BOUNDARIES_ATTRIBUTE);
  }

  set value(value: T) {
    this._value;
  }
}

const createContextGetter = (clazz, target) => {
  switch (target.kind) {
    case 'method':
      const originalDescriptor = Object.getOwnPropertyDescriptor(clazz.prototype, target.key);
      return function getterDefaultContextConsumer() {
        const defaultValue = originalDescriptor.get.call(this);
        console.log('hmmm', defaultValue);
        return defaultValue + '....';
      };
    case 'field':
      if (target.initializer === undefined) {
        return function fieldDefaultWithoutInitializerContextConsumer() {
          return undefined;
        };  
      } else {
        return function fieldDefaultWithInitializerContextConsumer() {
          return target.initializer.call(this);
        };  
      }
  }
}

export const createContext = () => {
  const consumerDecorator = (target) => {
    console.log(target);
    return {
      kind: "method",
      key: target.key,
      placement: "prototype",
      descriptor: {
        ...target.descriptor,
        configurable: true,
      },
      finisher: (clazz) => {
        Object.defineProperty(clazz.prototype, target.key, {
          get: createContextGetter(clazz, target)
        });
      }
    }
  };

  const providerDecorator = (target, key, descriptor) => {
    
  };

  return {
    consumer: consumerDecorator,
    provider: providerDecorator,
  }
};
