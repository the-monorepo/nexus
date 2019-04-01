import { reaction, decorate, action, computed, observable } from 'mobx';
const PROPS = Symbol('props');
const assignAttribute = action((element, key, value) => {
  element[key] = value;
  if (element[PROPS]) {
    element[PROPS][key] = value;
  }
});

function assignAttributes(element, attributes) {
  if (!attributes) {
    return;
  }
  Object.keys(attributes).forEach(key => { 
    const attributeValue = attributes[key];
    if (typeof attributeValue === 'function') {
      reaction(attributeValue, action((value) => {
        assignAttribute(element, key, value);
      }), { fireImmediately: true });
    } else {
      assignAttribute(element, key, attributeValue);
    }
  });
}

function removeChildren(element, childOrChildren) {
  if (childOrChildren === undefined) {
    return;
  }
  if (childOrChildren === null) {
    return;
  }
  if (typeof childOrChildren === 'function') {
    return;
  }
  if (Array.isArray(childOrChildren)) {
    return childOrChildren.map(child => removeChildren(element, child));
  }
  if (childOrChildren instanceof Node) {
    element.removeChild(childOrChildren);
  }
}

function addChildren(element, childOrChildren, before) {
  if (childOrChildren === undefined) {
    return;
  }

  if (childOrChildren === null) {
    return;
  }

  if (childOrChildren instanceof Node) {
    const newElement = childOrChildren;
    element.insertBefore(newElement, before);
    return newElement;
  }

  if (['string', 'boolean', 'number'].includes(typeof childOrChildren)) {
    const newElement = document.createTextNode(childOrChildren.toString());
    element.insertBefore(newElement, before);
    return newElement;
  }

  if (Array.isArray(childOrChildren)) {
    return childOrChildren.map(child => addChildren(element, child, before));
  }

  const child = childOrChildren;

  if (typeof child === 'function') {
    let previous;
    const positionMarkerElement = document.createComment('');
    element.appendChild(positionMarkerElement);
    reaction(child, next => {
      removeChildren(element, previous);
      previous = addChildren(element, next, positionMarkerElement);
    }, { fireImmediately: true });
  } else {

    const component = childOrChildren.component;
    const attributes = childOrChildren.attributes;
    const children = attributes && attributes.children ? attributes.children : childOrChildren.children;

    const childElementResult = (() => {
      if (typeof component === 'string') {
        const newElement = document.createElement(component);
        assignAttributes(newElement, attributes);
        addChildren(newElement, children, null);
        return newElement;
      } else if (component.prototype instanceof Node) {
        const newElement = new component();
        assignAttributes(newElement, attributes);
        addChildren(newElement, children, null);
        return newElement;
      } else {
        // TODO: This needs to be computed
        return component({ attributes, children });
      }
    })();

    return addChildren(element, childElementResult, before);
  }
}

export function render(element, renderInfo) {
  return addChildren(element, renderInfo, null);
}

export abstract class MobxElement extends HTMLElement {
  constructor() {
    super();
    this.hasInitialized = false;
    this.shadow = this.attachShadow({ mode: 'open' });
    this[PROPS] = observable({});
  }

  public get props() {
    return this[PROPS];
  }

  connectedCallback() {
    this.initialize();
  }

  protected abstract render();

  private initialize() {
    if (!this.hasInitialized) {
      this.hasInitialized = true;
      render(this.shadow, this.render());  
    }
  }
}

decorate(MobxElement, {
  render: computed,
})


export function Fragment({ children }) {
  return children;
}

export function createElement(component, attributes, ...children) {
  return { component, attributes, children };
}
