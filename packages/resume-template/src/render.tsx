import { autorun, reaction, isComputed } from 'mobx';

function assignAttributes(element, attributes) {
  if (!attributes) {
    return;
  }
  Object.keys(attributes).forEach(key => {
    const attributeValue = attributes[key];
    if (typeof attributeValue === 'function') {
      autorun(() => {
        element[key] = attributes[key]();
      });  
    } else {
      element[key] = attributes[key];
    }
  });
}

function removeChildren(element, childOrChildren) {
  console.log(typeof childOrChildren);
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
  element.removeChild(childOrChildren);  
}

function addChildren(element, childOrChildren) {
  if (childOrChildren === undefined) {
    return;
  }

  if (childOrChildren === null) {
    return;
  }

  if (childOrChildren instanceof Element) {
    const newElement = childOrChildren;
    element.appendChild(newElement);
    return newElement;
  }

  if (['string', 'boolean', 'number'].includes(typeof childOrChildren)) {
    const newElement = document.createTextNode(childOrChildren.toString());
    element.appendChild(newElement);
    return newElement;
  }

  if (Array.isArray(childOrChildren)) {
    return childOrChildren.map(child => addChildren(element, child));
  }
  
  const child = childOrChildren;
  console.log('child', child);
  console.log('child type', typeof child);
  if (typeof child === 'function') {
    console.log('reaction');
    let previous;
    reaction(child, (next) => {
      console.log(previous);
      removeChildren(element, previous);
      previous = addChildren(element, next);
    })
  } else {
    console.log('not a reaction');
    const childElement = createElement(child);
    element.appendChild(childElement);
    return childElement;
  }
}

export function render(element, renderInfo) {
  console.log('render', renderInfo)
  addChildren(element, createElement(renderInfo));
}

const createElement = (props) => {
  if (props === null) {
    return;
  }
  if (props === undefined) {
    return;
  }
  
  console.log('props', props);
  const [component, attributes, ...children] = props;

  if (!!attributes && !!attributes.children) {
    children = attributes.children;
  }

  const element = (() => {
    if (typeof component === 'string') {
      const newElement = document.createElement(component);
      assignAttributes(newElement, attributes);
      return newElement;
    } else if(component.prototype instanceof HTMLElement) {
      const newElement = new component();
      assignAttributes(newElement, attributes);            
      return newElement;
    } else if(component === null) {
      const newElement = document.createDocumentFragment();
      assignAttributes(newElement, attributes);
      return newElement;
    } else {
      return component(attributes, ...children);
    }
  })();
  
  addChildren(element, children);

  return element;
}