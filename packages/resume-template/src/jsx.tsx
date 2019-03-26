window.Fragment = function Fragment() {

}

window.dom = function dom(component, attributes, ...children) {
  // Figure out component
  const tag = typeof component === 'function' ? component() : component;

  // Create the component
  const element = typeof tag === 'string' ? document.createElement(tag) : tag;

  // Set props
  if (attributes) {
    Object.keys(attributes)
    .forEach(key => element.setAttribute(key, attributes[key]));
  }

  // Add children
  if (children) {
    children.forEach(child => element.appendChild(
      typeof child === 'string' ? document.createTextNode(child) : child)
    );
  }
  return element;
}