window.Fragment = function Fragment(children) {
  const fragment = document.createDocumentFragment();
  if (!!children) {
    children.filter(child => !!child).forEach(child => fragment.appendChild(child));
  }
  return fragment;
}

function addChildren(element, children) {
  children.filter(child => !!child).forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (Array.isArray(child)) {
      addChildren(element, child);
    } else {
      element.appendChild(child);
    }
  })
}

window.dom = function dom(component, attributes, ...children) {
  // Figure out component
  const tag = typeof component === 'function' ? component(attributes) : component;

  // Create the component
  const element = (() => {
    if (typeof tag === 'string') {
      const newElement = document.createElement(tag);
      // Set props
      if (attributes) {
        Object.keys(attributes)
        .forEach(key => newElement.setAttribute(key, attributes[key]));
      }
      return newElement;
    } else {
      return tag;
    }
  })()
  console.log(element);

  // Add children
  addChildren(element, children);

  return element;
}