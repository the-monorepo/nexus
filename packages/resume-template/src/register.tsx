window.Fragment = function Fragment({children}) {
  const fragment = document.createDocumentFragment();
  //console.log(children);
  if (!!children) {
    addChildren(fragment, children);
  }
  return fragment;
}

function addChildren(element, children) {
  children.filter(child => !!child).forEach(component => {
    const child = typeof component === 'function' ? component() : component;
    if (Array.isArray(child)) {
      addChildren(element, child);
    } else {
      element.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
  })
}

window.dom = function dom(component, attributes, ...children) {
  if (!!attributes && !!attributes.children) {
    children = attributes.children;
  }
  //console.warn('children', children);
  //console.log(attributes);
  // Figure out component
  if ((typeof component === 'function') && !(component.prototype instanceof HTMLElement)) {
    return component({ ...attributes, children });    
  } 
  const tag = component;

  // Create the component
  const element = (() => {
    if (typeof tag === 'string' || (tag.prototype instanceof HTMLElement)) {
      console.log('tag', tag);
      const newElement = typeof tag === 'string' ? document.createElement(tag) : new tag();
      console.log('created element', newElement);
      // Set props
      if (attributes) {
        Object.keys(attributes)
          .forEach(key => {
            newElement[key] = attributes[key]
          });
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