import {
  reaction,
  decorate,
  action,
  computed,
  observable,
  isObservableArray,
  toJS,
} from 'mobx';

export const map = (arr, mapFn) => {
  if (isObservableArray(arr)) {
    const result = observable.array();
    arr.observe(
      action(changeData => {
        switch (changeData.type) {
          case 'splice':
            result.splice(
              changeData.index,
              changeData.removedCount,
              ...changeData.added.map((value, index) =>
                mapFn(value, index + changeData.index),
              ),
            );
            break;
          case 'update':
            result.splice(
              changeData.index,
              1,
              mapFn(changeData.newValue, changeData.index),
            );
            break;
        }
      }),
      true,
    );
    return result;
  }
  return arr.map(mapFn);
};

const PROPS = Symbol('props');
const assignAttribute = action((element, key, value) => {
  if (key === 'style') {
    Object.keys(value).forEach(key => {
      element.style[key] = value[key];
    });
  } else {
    element[key] = value;
    if (element[PROPS]) {
      element[PROPS][key] = value;
    }
  }
});

function applyAttribute(element, attributes, key) {
  const attributeValue = attributes[key];
  if (typeof attributeValue === 'function') {
    reaction(
      attributeValue,
      action(value => {
        assignAttribute(element, key, value);
      }),
      { fireImmediately: true },
    );
  } else {
    assignAttribute(element, key, attributeValue);
  }
}

function assignAttributes(element, attributes) {
  if (!attributes) {
    return;
  }
  Object.keys(attributes).forEach(key => {
    applyAttribute(element, attributes, key);
  });
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

const textNodeTypes = new Set(['string', 'boolean', 'number']);
export function render(parent, renderInfo, before) {
  if(textNodeTypes.has(typeof renderInfo)) {
    const child = document.createTextNode(renderInfo);
    parent.insertBefore(child, before);
    return () => {
      child.parentNode.removeChild(child);
    };
  }
  const fragment = document.importNode(renderInfo.template.content, true);
  const unmountFns = (() => {
    if (Array.isArray(renderInfo)) {
      return renderInfo.map(item => render(fragment, item, undefined));
    } else {
      const dynamicInfo = renderInfo.dynamic(0).map((dynamicSegment) => ({
        element: dynamicSegment.getElement(fragment),
        callback: dynamicSegment.callback,
      }));
      return dynamicInfo
        .map(({ callback, element }) => callback(element))
        .filter((unmountFn) => unmountFn !== undefined);
    }
  })();
  console.warn('unmountfns', unmountFns);
  parent.insertBefore(fragment, before);
  return () => unmountFns.forEach(unmountFn => unmountFn());
}

function createParentNodeClient(parent) {
  let i = 0;
  return {
    appendChild(element) {
      i++;
      return parent.appendChild(element);
    },
    appendFragment(element) {
      i += element.children.length;
      return parent.appendChild(element);
    },
    get length() {
      return i;
    }
  }
}

function addStaticElements(parentClient, children, dynamic) {
  for(const child of children) {
    if (Array.isArray(child) && isObservableArray(child)) {
      addStaticElements(parentClient, children, dynamic);
    } else {
      if (typeof child === 'function') {
        const positionMarker = document.createComment('');
        const positionMarkerIndex = parentClient.length;
        parentClient.appendChild(positionMarker);
        let previous;
        dynamic.push({
          getElement: (clonedParent) => clonedParent.children[positionMarkerIndex],
          callback: (clonedPositionMarker) => {
            let previousUnmountFn = () => {};
            const reactionDisposer = reaction(
              child,
              next => {
                console.log('re-render');
                previousUnmountFn();
                previousUnmountFn = render(clonedPositionMarker.parentNode, next, clonedPositionMarker);
              },
              { fireImmediately: true },
            );
            return () => {
              reactionDisposer();
              previousUnmountFn();
              clonedPositionMarker.parentNode.removeChild(clonedPositionMarker);
            };
          }
        });
      } else if (textNodeTypes.has(typeof child)) {
        const element = document.createTextNode(child.toString());
        parentClient.appendChild(element);
      } else {
        if (child.element) {
          let index = parentClient.length;
          parentClient.appendChild(child.element);
          dynamic.push(...child.dynamic(index));
        } else if(child.fragment) {
          parentClient.appendFragment(child.fragment);
          dynamic.push(...child.dynamic());
        }
      }
    }
  }
}

function createTemplateFromElement(element) {
  const template = document.createElement('template');
  template.content.appendChild(element);
  return template;
}

export function Fragment({ children }) {
  let lazyTemplate;
  const fragment = document.createDocumentFragment();
  const dynamic = [];
  addStaticElements(createParentNodeClient(fragment), children, dynamic);

  return {
    fragment,
    get template() {
      if (lazyTemplate) {
        return lazyTemplate;
      }
      lazyTemplate = createTemplateFromElement(fragment);  
      return lazyTemplate;    
    },
    dynamic() {
      return dynamic;
    }
  }
}

export function createElement(component, attributes, ...children) {
  const dynamic = [];
  if (typeof component === 'string' || component.prototype instanceof Node) {
    const element = component.prototype instanceof Node ? new component() : document.createElement(component);
    let lazyTemplate;
    addStaticElements(createParentNodeClient(element), children, dynamic);
    console.log('creating', element);
    return { 
      element,
      get template() {
        if (lazyTemplate) {
          return lazyTemplate;
        }
        lazyTemplate = createTemplateFromElement(element);      
        return lazyTemplate;
      },
      dynamic(index) {
        return dynamic.concat({
          getElement: (parent) => parent.children[index],
          callback: (clonedElement) => {
            // TODO: Some attributes can be static
            assignAttributes(clonedElement, attributes);
            return () => {
              clonedElement.parentNode.removeChild(clonedElement);
            }
          }
        });
      }
    };
  } else {
    return component({ children, ...attributes });
  } 
}