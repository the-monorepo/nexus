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

  private initialize() {
    if (!this.hasInitialized) {
      this.hasInitialized = true;
      render(this.shadow, this.constructor.render);
    }
  }
}

function wrapCallbacks(objs, getCallback) {
  return () => objs.forEach(obj => getCallback(obj)());
}

const textNodeTypes = new Set(['string', 'boolean', 'number']);
export function render(parent, renderInfo, before) {
  if (textNodeTypes.has(typeof renderInfo)) {
    const child = document.createTextNode(renderInfo);
    parent.insertBefore(child, before);
    console.log('inserted', child);
    return {
      removeChildren: () => {
        console.log('removed child', child);
        child.parentNode.removeChild(child)
      },
      disposeReactions: () => {},
    };
  } else if (Array.isArray(renderInfo)) {
    const fragment = document.createDocumentFragment();
    const unmountObjs = renderInfo.map(item => render(fragment, item, undefined));
    parent.insertBefore(fragment, before);
    return {
      removeChildren: wrapCallbacks(unmountObjs, (obj) => obj.removeChildren),
      disposeReactions: wrapCallbacks(unmountObjs, (obj) => obj.disposeReactions),
    };
  } else {
    renderInfo = renderInfo.renderInfo;
    const templateInfo = renderInfo.template();
    const fragment = document.importNode(templateInfo.template.content, true);
    const elements = Array.from(fragment.children);
    const dynamicInfo = templateInfo.dynamic.map(dynamicSegment => ({
      element: dynamicSegment.getElement(fragment),
      callback: dynamicSegment.callback,
    }));
    const unmountObjs = dynamicInfo
      .map(({ callback, element }) => callback(element));
    parent.insertBefore(fragment, before);
    return {
      removeChildren: () => elements.forEach(element => element.parentNode.removeChild(element)),
      disposeReactions: wrapCallbacks(unmountObjs, (obj) => obj.disposeReactions),
    };
  }
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
    },
  };
}

function addStaticElements(parentClient, children, dynamic) {
  for (const child of children) {
    if (Array.isArray(child) && isObservableArray(child)) {
      addStaticElements(parentClient, children, dynamic);
    } else if (typeof child === 'function') {
      const positionMarker = document.createComment('');
      const positionMarkerIndex = parentClient.length;
      console.log('marker index', positionMarkerIndex)
      parentClient.appendChild(positionMarker);
      let previous;
      dynamic.push({
        getElement: clonedParent => {
          console.log('children', clonedParent.childNodes);
          const e = clonedParent.childNodes[positionMarkerIndex];
          console.log('position marker received-expected', e, positionMarker, clonedParent);
          return e;
        },
        callback: clonedPositionMarker => {
          let unmountObj = {
            disposeReactions: () => {},
            removeChildren: () => {},
          };
          const reactionDisposer = reaction(
            child,
            next => {
              console.log('re-render', next);
              unmountObj.disposeReactions();
              unmountObj.removeChildren();
              unmountObj = render(
                clonedPositionMarker.parentNode,
                next,
                clonedPositionMarker,
              );
            },
            { fireImmediately: true },
          );
          return {
            disposeReactions: () => {
              reactionDisposer();
              unmountObj.disposeReactions();
            },
            removeChildren: () => {
              unmountObj.removeChildren();
              clonedPositionMarker.parentNode.removeChild(clonedPositionMarker);
            }
          }
        },
      });
    } else if (textNodeTypes.has(typeof child)) {
      const element = document.createTextNode(child.toString());
      parentClient.appendChild(element);
    } else {
      const renderInfo = child.renderInfo;
      let index = parentClient.length;
      if (renderInfo.element) {
        parentClient.appendChild(renderInfo.element);
      } else if (renderInfo.fragment) {
        parentClient.appendFragment(renderInfo.fragment);
      } else {
        throw new Error('Invalid child type');
      }
      const childDynamic = renderInfo.dynamic(index);
      dynamic.push(...childDynamic);
    }
  }
}

function lazyTemplateFactory(element, getDynamic) {
  let lazyTemplate;
  return () => {
    if (lazyTemplate) {
      return lazyTemplate;
    }
    console.log('element template', element);
    lazyTemplate = document.createElement('template');
    lazyTemplate.content.appendChild(element);
    return { template: lazyTemplate, get dynamic() { return getDynamic(); } };      
  }
}

export function Fragment({ children }) {
  let lazyData;
  return {
    get renderInfo() {
      if (lazyData) {
        return lazyData;
      }
      let lazyTemplate;
      const fragment = document.createDocumentFragment();
      const dynamic = [];
      addStaticElements(createParentNodeClient(fragment), children, dynamic);
      const getDynamic = () => dynamic;
      lazyData = {
        fragment,
        template: lazyTemplateFactory(fragment, getDynamic),
        dynamic: getDynamic,
      };
      return lazyData;  
    }
  }
}

export function createElement(component, attributes, ...children) {
  if (typeof component === 'string' || component.prototype instanceof Node) {
    let lazyData;
    return {
      get renderInfo() {
        if (lazyData) {
          return lazyData;
        }
        let lazyTemplate;
        const dynamic = [];
        const element = component.prototype instanceof Node
          ? new component()
          : document.createElement(component);
        addStaticElements(createParentNodeClient(element), children, dynamic);  
        function getDynamic(index) {
          return dynamic.map(item => ({
            ...item,
            getElement: parent => {
              const e = item.getElement(parent.childNodes[index]);
              console.log('wrapped', index, e, "??", parent);
              return e;
            }
          })).concat({
            getElement: parent => {
              const e = parent.childNodes[index];
              console.log('createElement received-expected', e, element, parent);
              return e;
            },
            callback: clonedElement => {
              // TODO: Some attributes can be static
              assignAttributes(clonedElement, attributes);
              return {
                disposeReactions: () => {},
                removeChildren: () => {
                  clonedElement.parentNode.removeChild(clonedElement);
                }
              };
            },
          });
        }
        lazyData = {
          dynamic,
          element,
          template: lazyTemplateFactory(element, () => getDynamic(0)),
          dynamic(index) {
            return getDynamic(index);
          },  
        }
        return lazyData;
      }
    };
  } else {
    return component({ children, ...attributes });
  }
}
