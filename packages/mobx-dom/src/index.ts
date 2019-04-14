import {
  reaction,
  decorate,
  action,
  computed,
  observable,
  isObservableArray,
  toJS,
} from 'mobx';

export abstract class MobxElement extends HTMLElement {
  private readonly shadow;
  private unmountObj;
  public static template: any;
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.unmountObj = render(this.shadow, this.constructor.template, undefined, this);
  }

  disconnectedCallback() {
    // TODO: Maybe just dispose of reactions and recreate them on connectedCallback
    if (this.unmountObj) {
      if (this.unmountObj.disposeReactions) {
        this.unmountObj.disposeReactions();
      }
      if (this.unmountObj.removeChildren) {
        this.unmountObj.removeChildren();
      }
    }
  }
}

function wrapCallbacks(objs, getCallback) {
  const filteredCallbacks = objs
    .filter(obj => !!obj)
    .map(getCallback)
    .filter(callback => !!callback);
  return () => filteredCallbacks.forEach(callback => callback());
}

const textNodeTypes = new Set(['string', 'boolean', 'number']);
interface DynamicCallbacks {
  firstElement?: () => any;
  removeChildren?: () => void;
  disposeReactions?: () => void;
}

export function render(
  parent,
  renderInfo,
  before?,
  thisArg?,
): DynamicCallbacks | undefined {
  if (renderInfo === undefined || renderInfo === null) {
    return undefined;
  } else if (textNodeTypes.has(typeof renderInfo)) {
    const child = document.createTextNode(renderInfo);
    parent.insertBefore(child, before);
    return {
      firstElement: () => child,
      removeChildren: () => {
        child.remove();
      },
    };
  } else if (isObservableArray(renderInfo)) {
    const childElements: (DynamicCallbacks | undefined)[] = new Array(renderInfo.length);
    const dispose = renderInfo.observe(changeData => {
      if (changeData.type === 'splice') {
        const elementToAddBefore = (() => {
          let index = changeData.index;
          while (index < childElements.length) {
            const unmountObj = childElements[changeData.index];
            if (unmountObj && unmountObj.firstElement) {
              return unmountObj.firstElement();
            } else {
              return before;
            }
          }
          return before;
        })();
        const parentToAddTo = elementToAddBefore ? elementToAddBefore.parentNode : parent;
        const fragment = document.createDocumentFragment();
        const addedElements = changeData.added.map(child =>
          render(fragment, child, undefined, thisArg),
        );
        parentToAddTo.insertBefore(fragment, elementToAddBefore);
        const removed = childElements.splice(
          changeData.index,
          changeData.removedCount,
          ...addedElements,
        );
        for (const unmountObj of removed) {
          if (unmountObj) {
            if (unmountObj.disposeReactions) {
              unmountObj.disposeReactions();
            }
            if (unmountObj.removeChildren) {
              unmountObj.removeChildren();
            }
          }
        }
      }
    }, true);
    return {
      firstElement: () => {
        for (const childElement of childElements) {
          if (childElement) {
            if (childElement.firstElement) {
              const potentialFirstElement = childElement.firstElement();
              if (potentialFirstElement) {
                return potentialFirstElement;
              }
            }
          }
        }
        return before;
      },
      disposeReactions: () => {
        dispose();
        wrapCallbacks(childElements, obj => obj.disposeReactions)();
      },
      removeChildren: wrapCallbacks(childElements, obj => obj.removeChildren),
    };
  } else if (Array.isArray(renderInfo)) {
    const fragment = document.createDocumentFragment();
    const unmountObjs = renderInfo.map(item =>
      render(fragment, item, undefined, thisArg),
    );
    parent.insertBefore(fragment, before);
    return {
      firstElement: () => {
        for (const obj of unmountObjs) {
          if (obj) {
            const potentialFirstElement = obj.firstElement;
            if (potentialFirstElement) {
              return potentialFirstElement;
            }
          }
        }
        return undefined;
      },
      removeChildren: wrapCallbacks(unmountObjs, obj => obj.removeChildren),
      disposeReactions: wrapCallbacks(unmountObjs, obj => obj.disposeReactions),
    };
  } else {
    const info = renderInfo.renderInfo();
    const element = info.element;
    const unmountObj = info.dynamic(element, thisArg);
    parent.insertBefore(element, before);
    return unmountObj;
  }
}

function addStaticElements(parent, children, dynamic) {
  for (const child of children) {
    if (typeof child === 'function') {
      const positionMarker = document.createComment('');
      const index = parent.childNodes.length;
      parent.appendChild(positionMarker);
      dynamic.push((clonedParent, thisArg) => {
        const clonedPositionMarker = clonedParent.childNodes[index];
        let unmountObj;
        const boundChild = child.bind(thisArg);
        const reactionDisposer = reaction(
          boundChild,
          next => {
            if (unmountObj) {
              if (unmountObj.disposeReactions) {
                unmountObj.disposeReactions();
              }
              if (unmountObj.removeChildren()) {
                return unmountObj.removeChildren();
              }
            }
            unmountObj = render(
              clonedPositionMarker.parentNode,
              next,
              clonedPositionMarker,
              thisArg,
            );
          },
          { fireImmediately: true },
        );
        return {
          firstElement: () => {
            if (unmountObj && unmountObj.firstElement) {
              const potentialFirstElement = unmountObj.firstElement();
              if (potentialFirstElement) {
                return potentialFirstElement;
              }
            }
            return clonedPositionMarker;
          },
          disposeReactions: () => {
            reactionDisposer();
            if (unmountObj && unmountObj.disposeReactions) {
              unmountObj.disposeReactions();
            }
          },
          removeChildren: () => {
            if (unmountObj && unmountObj.removeChildren) {
              unmountObj.removeChildren();
            }
            clonedPositionMarker.remove();
          },
        };
      });
    } else if (textNodeTypes.has(typeof child)) {
      const element = document.createTextNode(child.toString());
      parent.appendChild(element);
    } else {
      const renderInfo = child.renderInfo();
      let index = parent.childNodes.length;
      parent.appendChild(renderInfo.element);
      const childDynamic = (clonedParent, thisArg) => {
        return renderInfo.dynamic(clonedParent.childNodes[index], thisArg);
      }
      dynamic.push(childDynamic);
    }
  }
}

function lazyTemplateFactory(element, dynamic, getCallbackElement) {
  let lazyTemplate;
  return (dynamicOverride = dynamic) => {
    if (lazyTemplate) {
      return lazyTemplate;
    }
    const template = document.createElement('template');
    template.content.appendChild(element);
    document.body.appendChild(template);
    lazyTemplate = { template, dynamic: (templateContent, thisArg) => dynamicOverride(getCallbackElement(templateContent), thisArg) };
    return lazyTemplate;
  };
}

export function Fragment({ children }) {
  let lazyData;
  return {
    renderInfo: () => {
      if (lazyData) {
        return lazyData;
      }
      const element = document.createDocumentFragment();
      const childObserveFns: any[] = [];
      addStaticElements(element, children, childObserveFns);
      const dynamic = (clonedElement, thisArg) => {
          const itemsCallbacks = childObserveFns
            .map(item => item(clonedElement, thisArg))
            .filter(callback => !!callback);
          return {
            firstElement: () => {
              for (const itemCallbacks of itemsCallbacks) {
                if (itemCallbacks.firstElement) {
                  const potentialFirstElement = itemCallbacks.firstElement();
                  return potentialFirstElement;
                }
              }
              return null;
            },
            disposeReactions: wrapCallbacks(itemsCallbacks, obj => obj.disposeReactions),
            removeChildren: wrapCallbacks(itemsCallbacks, obj => obj.removeChildren),
          };
        };
      const getElementFromTemplate = (templateContent) => templateContent;
      lazyData = {
        getElementFromTemplate,
        element,
        template: lazyTemplateFactory(element, dynamic, getElementFromTemplate),
        dynamic
      };
      return lazyData;
    },
  };
}

const ATTR_TYPE = 0;
const PROP_TYPE = 1;
const EVENT_TYPE = 2;

// TODO: Transpile this in babel
function extractFieldInfo(jsxAttributeObj) {
  const dynamicFields: any[] = [];
  const staticAttrs = {};
  const staticProps = {};
  for (const name in jsxAttributeObj) {
    const value = jsxAttributeObj[name];
    const cleanedName = name.replace(/^\$?\$?/, '');
    if(name.match(/^\$\$/)) {
      // Events are always dynamic since they have to be wrapped in {} anyway
      dynamicFields.push({
        type: EVENT_TYPE,
        name: cleanedName,
        callback: value
      });
    } else {
      const isDynamic = typeof value === 'function';
      if (name.match(/^\$/)) {
        const field = { type: PROP_TYPE, name: cleanedName, callback: value };
        if (isDynamic) {
          dynamicFields.push(field);
        } else {
          staticProps[name] = value;
        }
      } else {
        const field = { type: ATTR_TYPE, name: cleanedName, callback: value };
        if (isDynamic) {
          dynamicFields.push(field);
        } else {
          staticAttrs[name] = value;
        }
      }
    }
  }
  return {
    dynamicFields,
    staticProps,
    staticAttrs,
  }
}

function addStaticAttributes(element, attributes) {
  for(const name in attributes) {
    element.setAttribute(name, attributes[name]);
  }
}

function initDynamicSetter(thisArg, dynamicValue, updateCallback) {
  const boundDynamicValue = dynamicValue.bind(thisArg);  
  const actionedUpdateCallback = action(updateCallback);

  let previousUnmount;
  
  const dispose = reaction(
    boundDynamicValue,
    (next) => {
      if (previousUnmount) {
        previousUnmount();
      }
      previousUnmount = actionedUpdateCallback(next);
    }, 
    { fireImmediately: true }
  );
  
  return () => {
    dispose();
    if (previousUnmount) {
      previousUnmount();
    }
  }
}

function initDynamicSetters(
  thisArg,
  dynamicFieldInfos,
  mountFactories,
) {
  const disposals: any[] = [];
  for(const { type, name, callback } of dynamicFieldInfos) {
    const wrappedCallback = callback.bind(thisArg);
    const disposal = (() => {
      switch(type) {
        case ATTR_TYPE:
          return initDynamicSetter(thisArg, wrappedCallback, (value) => mountFactories.attrs(name, value));
        case PROP_TYPE:
          return initDynamicSetter(thisArg, wrappedCallback, (value) => mountFactories.props(name, value));
        case EVENT_TYPE:
          return initDynamicSetter(thisArg, wrappedCallback, (value) => mountFactories.listeners(name, value));
        default: 
          throw new Error(`Unexpected field type ${type} for name ${name}`);
      }
    })();
    disposals.push(disposal);
  }
  return () => disposals.forEach(disposal => disposal());
}

function initDynamicSettersForElement(
  element,
  thisArg,
  dynamicFieldInfos,
) {
  return initDynamicSetters(thisArg, dynamicFieldInfos, {
    attrs: (name, value) => {
      element.setAttribute(name, value);
    },
    props: (name, value) => {
      element[name] = value;
    },
    listeners: (name, listener) => {
      if (typeof listener === 'function') {
        element.addEventListener(name, listener);
        return () => element.removeEventListener(name, listener);
      } else {
        element.addEventListener(name, listener.handleEvent, listener);
        return () => element.removeEventListener(name, listener.handleEvent, listener);
      }
    }
  });
}

function initDynamicSettersForStaticComponentObject(object, thisArg, dynamicFieldInfos) {
  for (const { type, name, callback } of dynamicFieldInfos) {
    const boundCallback = callback.bind(thisArg);
    const innerFieldObj = (() => {
      switch(type) {
        case ATTR_TYPE:
          return object.attrs;
        case EVENT_TYPE:
          return object.listeners;
        case PROP_TYPE:
          return object.props;
        default:
          throw new Error('Invalid type');
      }
    })();
    Object.defineProperty(innerFieldObj, name, { get() { return boundCallback() } })
  }
}

export function createElement(component, jsxAttributeObj = {}, ...children) {
  const { staticAttrs, staticProps, dynamicFields } = extractFieldInfo(jsxAttributeObj);
  if(component.renderInfo) {
    let lazyData;
    return {
      renderInfo: () => {
        if(lazyData) {
          return lazyData;
        }
        const renderInfo = component.renderInfo();
        
        const dynamic = (clonedParent, thisArg) => {   
          const wrappedChildren = children.map(child => {
            if (typeof child === 'function') {
              return child.bind(thisArg);
            }
            return child;
          });

          const props: any = Object.create(staticProps);
          const attrs: any = Object.create(staticAttrs);
          const listeners: any = {};
          
          const thisReplacement = {
            children: wrappedChildren,
            props: props,
            attrs: attrs,
            listeners: listeners
          };

          initDynamicSettersForStaticComponentObject(thisReplacement, thisArg, dynamicFields);

          const clonedElement = renderInfo.getElementFromTemplate(clonedParent);
          return renderInfo.dynamic(
            clonedElement, 
            thisReplacement            
          )
        };

        const getTemplate = () => renderInfo.template(dynamic);

        lazyData = {
          getElementFromTemplate: renderInfo.getElementFromTemplate, 
          get element() { return document.importNode(renderInfo.template().template.content, true) },
          template: getTemplate,
          dynamic,
        };
        return lazyData;
      }
    };
  } else if (typeof component === 'string' || component.prototype instanceof Node) {
    let lazyData;
    return {
      renderInfo: () => {
        if (lazyData) {
          return lazyData;
        }
        const childObserveFns: any[] = [];
        const element =
          component.prototype instanceof Node
            ? new component()
            : document.createElement(component);
        addStaticAttributes(element, staticAttrs);
        addStaticElements(element, children, childObserveFns);
        const dynamic = (clonedElement, thisArg) => {
          for(const name in staticProps) {
            clonedElement[name] = staticProps[name];
          }
          const unmountSetters = initDynamicSettersForElement(
            clonedElement,
            thisArg,
            dynamicFields,
          );
          const itemsCallbacks = childObserveFns
            .map(item => {
              return item(clonedElement, thisArg);
            })
            .filter(callback => !!callback);
          return {
            disposeReactions: () => {
              unmountSetters();
              for (const itemCallbacks of itemsCallbacks) {
                if (itemCallbacks.disposeReactions) {
                  itemCallbacks.disposeReactions();
                }
              }
            },
            firstElement: () => clonedElement,
            removeChildren: () => {
              clonedElement.remove();
            },
          };
        }
        const getElementFromTemplate = templateContent => templateContent.childNodes[0];
        lazyData = {
          element,
          getElementFromTemplate,
          template: lazyTemplateFactory(element, dynamic, getElementFromTemplate),
          dynamic,
        };
        return lazyData;
      },
    };
  } else {
    const unwrappedAttributes = jsxAttributeObj ? 
      Object.keys(jsxAttributeObj).reduce((obj, key) => {
        if (typeof jsxAttributeObj[key] === 'function') {
          obj[key] = jsxAttributeObj[key]();
        } else {
          obj[key] = jsxAttributeObj[key];
        }
        return obj;
      }, {}) : jsxAttributeObj;
    
    const unwrappedChildren = children.map(child => typeof child === 'function' ? child : child);
    const result = component({ children: unwrappedChildren, ...unwrappedAttributes });
    return result;
  }
}
