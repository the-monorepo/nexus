import {
  reaction,
  decorate,
  action,
  computed,
  observable,
  isObservableArray,
  toJS,
} from 'mobx';

const PROPS = Symbol('props');
const assignAttribute = action((element, key, value) => {
  if (key === 'style') {
    // TODO: There's go to be a better way to do this
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
export abstract class MobxElement extends HTMLElement {
  private readonly shadow;
  private unmountObj;
  public static template: any;
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this[PROPS] = observable({});
  }

  public get props() {
    return this[PROPS];
  }

  connectedCallback() {
    this.unmountObj = render(this.shadow, this.constructor.template, undefined, this);
  }

  disconnectedCallback() {
    // TODO: Maybe just dispose of reactions and recreate them on connectedCallback
    if (this.unmountObj) {
      if(this.unmountObj.disposeReactions) {
        this.unmountObj.disposeReactions();
      }
      if (this.unmountObj.removeChildren) {
        this.unmountObj.removeChildren();
      }
    }
  } 
}

function wrapCallbacks(objs, getCallback) {
  const filteredCallbacks = objs.filter(obj => !!obj).map(getCallback).filter(callback => !!callback);
  return () => filteredCallbacks.forEach(callback => callback());
}

const textNodeTypes = new Set(['string', 'boolean', 'number']);
type DynamicCallbacks = {
  firstElement?: () => any,
  removeChildren?: () => void,
  disposeReactions?: () => void,
}

function getSingleUseElementInfo(renderInfo) {
  const element = renderInfo.element ? renderInfo.element : renderInfo.fragment;
  const result = {
    element,
    dynamic: renderInfo.dynamic,
  }
  return result;
}

function getTemplateElementInfo(renderInfo) {
  const template = renderInfo.template();
  const templateContent = document.importNode(template.content, true);
  return { 
    element: templateContent.childNodes[0], 
    dynamic: renderInfo.dynamic,
  };
}

export function render(parent, renderInfo, before?, thisArg?, getElementInfo = getTemplateElementInfo): DynamicCallbacks | undefined {
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
  } else if(isObservableArray(renderInfo)) {
    const childElements: (DynamicCallbacks | undefined)[] = [];
    const dispose = renderInfo.observe(changeData => {
      if (changeData.type === 'splice') {
        const elementToAddBefore = (() => {
          let index = changeData.index;
          while(index < childElements.length) {
            const unmountObj = childElements[changeData.index];
            if (unmountObj && unmountObj.firstElement) {
              return unmountObj.firstElement();
            } else {
              return before;
            }            
          }
          return before;
        })();
        const parentToAddTo = elementToAddBefore
          ? elementToAddBefore.parentNode
          : parent;
        const fragment = document.createDocumentFragment();
        const addedElements = changeData.added.map(child =>
          render(fragment, child, undefined, thisArg, getSingleUseElementInfo),
        );
        parentToAddTo.insertBefore(fragment, elementToAddBefore);
        const removed = childElements.splice(
          changeData.index,
          changeData.removedCount,
          ...addedElements,
        );
        for(const unmountObj of removed) {
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
        for(const childElement of childElements) {
          if (childElement) {
            if(childElement.firstElement) {
              const potentialFirstElement = childElement.firstElement();
              if(potentialFirstElement) {
                return potentialFirstElement;
              }
            }  
          }
        }
        return before;
      },
      disposeReactions: () => {
        dispose();
        wrapCallbacks(childElements, (obj) => obj.disposeReactions)();
      },
      removeChildren: wrapCallbacks(childElements, (obj) => obj.removeChildren),
    }
  } else if (Array.isArray(renderInfo)) {
    const fragment = document.createDocumentFragment();
    const unmountObjs = renderInfo.map(item => render(fragment, item, undefined, thisArg, getSingleUseElementInfo));
    parent.insertBefore(fragment, before);
    return {
      firstElement: () => {
        for(const obj of unmountObjs) {
          if (obj) {
            const potentialFirstElement = obj.firstElement;
            if(!!potentialFirstElement) {
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
    const elementInfo = getElementInfo(renderInfo.renderInfo);
    const unmountObj = elementInfo.dynamic(elementInfo.element, thisArg);
    parent.insertBefore(elementInfo.element, before);
    return unmountObj;
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
    if (typeof child === 'function') {
      const positionMarker = document.createComment('');
      parentClient.appendChild(positionMarker);
      dynamic.push((clonedPositionMarker, thisArg) => {        
        let unmountObj;
        const boundChild = child.bind(thisArg);
        const reactionDisposer = reaction(
          boundChild,
          next => {
            if(unmountObj) {
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
              getSingleUseElementInfo
            );
          },
          { fireImmediately: true },
        );
        return {
          firstElement: () => {
            if (unmountObj && unmountObj.firstElement) {
              const potentialFirstElement = unmountObj.firstElement();
              if(potentialFirstElement) {
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
      const childDynamic = (clonedParent, thisArg) => renderInfo.dynamic(clonedParent.childNodes[index], thisArg);
      dynamic.push(childDynamic);
    }
  }
}

function lazyTemplateFactory(element) {
  let lazyTemplate;
  return () => {
    if (lazyTemplate) {
      return lazyTemplate;
    }
    const template = document.createElement('template');
    template.content.appendChild(element);
    lazyTemplate = template;
    return lazyTemplate;
  };
}

export function Fragment({ children }) {
  let lazyData;
  return {
    get renderInfo() {
      if (lazyData) {
        return lazyData;
      }
      const fragment = document.createDocumentFragment();
      const dynamic: any[] = [];
      addStaticElements(createParentNodeClient(fragment), children, dynamic);
      lazyData = {
        fragment,
        template: lazyTemplateFactory(fragment),
        dynamic(clonedElement, thisArg) {
          const itemsCallbacks = dynamic.map(item => item(clonedElement, thisArg)).filter(callback => !!callback);
          return {
            firstElement: () => {
              for(const itemCallbacks of itemsCallbacks) {
                if (itemCallbacks.firstElement) {
                  const potentialFirstElement = itemCallbacks.firstElement();
                  return potentialFirstElement;
                }
              }
              return null;
            },
            disposeReactions: wrapCallbacks(itemsCallbacks, (obj) => obj.disposeReactions),
            removeChildren: wrapCallbacks(itemsCallbacks, (obj) => obj.removeChildren),
          }
        }
      };
      return lazyData;
    },
  };
}

export function createElement(component, attributes, ...children) {
  if (typeof component === 'string' || component.prototype instanceof Node) {
    let lazyData;
    return {
      get renderInfo() {
        if (lazyData) {
          return lazyData;
        }
        const dynamic: any[] = [];
        const element =
          component.prototype instanceof Node
            ? new component()
            : document.createElement(component);
        addStaticElements(createParentNodeClient(element), children, dynamic);
        lazyData = {
          element,
          template: lazyTemplateFactory(element),
          dynamic(clonedElement, thisArg) {
            const disposals: any[] = [];
            if (attributes) {
              for(const key of Object.keys(attributes)) {
                const attributeValue = attributes[key];
                if (typeof attributeValue === 'function') {
                  const boundAttributeValue = attributeValue.bind(thisArg);
                  disposals.push(reaction(
                    boundAttributeValue,
                    action(value => {
                      assignAttribute(clonedElement, key, value)
                    }),
                    { fireImmediately: true },
                  ));
                } else {
                  assignAttribute(clonedElement, key, attributeValue);
                }
              }
            }
            const itemsCallbacks = dynamic.map(item => item(clonedElement, thisArg)).filter(callback => !!callback);
            return {
              disposeReactions: () => {
                disposals.forEach(dispose => dispose());
                for(const itemCallbacks of itemsCallbacks) {
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
          },
        };
        return lazyData;
      },
    };
  } else {
    return component({ children, ...attributes });
  }
}
