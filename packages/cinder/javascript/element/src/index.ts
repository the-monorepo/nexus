import * as cinder from '@cinderjs/core';

export const rerender = (target) => {
  const symbol = Symbol(`${String(target.key)}-value`);
  if (target.kind === 'field') {
    return {
      ...target,
      key: symbol,
      extras: [
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
              this[UPDATE]();
            },
          },
        },
      ],
    };
  } else {
    const descriptor = (() => {
      const oldDescriptor = target.descriptor;
      if (oldDescriptor.value !== undefined) {
        return {
          ...oldDescriptor,
          value: function (...args) {
            this[symbol](...args);
            this[UPDATE]();
          },
        };
      } else if (oldDescriptor.set !== undefined) {
        return {
          ...oldDescriptor,
          set: function (value) {
            this[symbol] = value;
            this[UPDATE]();
          },
        };
      } else {
        throw new Error(`Expected either a field, method or setter`);
      }
    })();
    return {
      ...target,
      key: symbol,
      extras: [
        {
          ...target,
          descriptor,
        },
      ],
    };
  }
};

export const UPDATE = Symbol('update');
export const MOUNT = Symbol('mount');
export const UNMOUNT = Symbol('unmount');

export abstract class RootlessDomElement<C, V> extends HTMLElement {
  protected renderRoot: Node;

  constructor() {
    super();
    this.renderRoot = this.mountRenderRoot();
  }

  abstract mountRenderRoot(): Node;

  connectedCallback() {
    this[MOUNT]();
  }

  disconnectedCallback() {
    this[UNMOUNT]();
  }

  [MOUNT]() {
    const result = this.render();
    cinder.render(result, this.renderRoot);
  }

  [UPDATE]() {
    const result = this.render();
    cinder.render(result, this.renderRoot);
  }

  [UNMOUNT]() {
    cinder.render(null, this.renderRoot);
  }

  abstract render(): cinder.ComponentResult<C, V, Node>;
}

export abstract class LightDomElement<C, V> extends RootlessDomElement<C, V> {
  mountRenderRoot() {
    return this;
  }
}

export abstract class DomElement<C, V> extends RootlessDomElement<C, V> {
  mountRenderRoot() {
    return this.attachShadow({ mode: 'open' });
  }
}
