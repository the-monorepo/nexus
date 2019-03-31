import { computed } from 'mobx';
function wrapWithComputedIfNeeded(value) {
  return value;
}

function wrapObjectWithComputed(obj) {
  if(!obj) {
    return;
  }
  return Object.keys(obj).reduce((wrapped, key) => {
    wrapped[key] = wrapWithComputedIfNeeded(obj[key]);
    return wrapped;
  }, {});    
}

function wrapArrayWithComputed(arr) {
  return arr.map(wrapWithComputedIfNeeded);
}

window.domFragment = function domFragment(attributes, ...children) {
  return [
    null,
    wrapObjectWithComputed(attributes),
    ...wrapArrayWithComputed(children),
  ];
}

window.dom = function dom(component, attributes, ...children) {
  return [
    component,
    wrapObjectWithComputed(attributes),
    ...wrapArrayWithComputed(children)
  ];
}