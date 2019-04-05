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
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this[PROPS] = observable({});
  }

  public get props() {
    return this[PROPS];
  }

  connectedCallback() {
    this.unmountObj = render.bind(this)(this.shadow, this.constructor.template);
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
  return renderInfo;
}

function getTemplateElementInfo(renderInfo) {
  const templateInfo = renderInfo.template();
  const element = document.importNode(templateInfo.template.content, true);
  return { element, dynamic: templateInfo.dynamic };
}

export function render(parent, renderInfo, before, getElementInfo = getTemplateElementInfo): DynamicCallbacks {
  console.log('this', this);
  if (renderInfo === undefined || renderInfo === null) {
    return;
  } else if (textNodeTypes.has(typeof renderInfo)) {
    const child = document.createTextNode(renderInfo);
    parent.insertBefore(child, before);
    return {
      firstElement: () => child,
      removeChildren: () => {
        child.parentNode.removeChild(child);
      },
    };
  } else if(isObservableArray(renderInfo)) {
    const childElements = [];
    const dispose = renderInfo.observe(changeData => {
      if (changeData.type === 'splice') {
        const elementToAddBefore =
          changeData.index < childElements.length
            ? childElements[changeData.index].firstElement()
            : before;
        const parentToAddTo = elementToAddBefore
          ? elementToAddBefore.parentNode
          : parent;
        const fragment = document.createDocumentFragment();
        const addedElements = changeData.added.map(child =>
          render.bind(this)(fragment, child),
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
    const diposeChildrenReactions = wrapCallbacks(childElements, (obj) => obj.disposeReactions);
    return {
      firstElement: () => childElements.length > 0 ? childElements[0].firstElement() : before,
      disposeReactions: () => {
        diposeChildrenReactions();
        wrapCallbacks(childElements, (obj) => obj.disposeReactions)();
      },
      removeChildren: wrapCallbacks(childElements, (obj) => obj.removeChildren),
    }
  } else if (Array.isArray(renderInfo)) {
    const fragment = document.createDocumentFragment();
    const unmountObjs = renderInfo.map(item => render(fragment, item, undefined, getSingleUseElementInfo));
    parent.insertBefore(fragment, before);
    return {
      firstElement: () => {
        for(const obj of unmountObjs) {
          const potentialFirstElement = obj.firstElement;
          if(!!potentialFirstElement) {
            return potentialFirstElement;
          }
        }
        return undefined;    
      },
      removeChildren: wrapCallbacks(unmountObjs, obj => obj.removeChildren),
      disposeReactions: wrapCallbacks(unmountObjs, obj => obj.disposeReactions),
    };
  } else {
    const elementInfo = getElementInfo(renderInfo.renderInfo);
    const dynamicInfo = elementInfo.dynamic.map(dynamicSegment => ({
      element: dynamicSegment.getElement(elementInfo.element),
      callback: dynamicSegment.callback,
    }));
    const unmountObjs = dynamicInfo.map(({ callback, element }) => callback.bind(this)(element));
    console.log('unmountObjs', unmountObjs);
    parent.insertBefore(elementInfo.element, before);
    return {
      firstElement: () => {
        for (const obj of unmountObjs) {
          if (obj.firstElement) {
            const potentialFirstElement = obj.firstElement();
            if (potentialFirstElement) {
              return potentialFirstElement;
            }  
          }
        }
        return null;
      },
      removeChildren: wrapCallbacks(unmountObjs, obj => obj.removeChildren),
      disposeReactions: wrapCallbacks(unmountObjs, obj => obj.disposeReactions),
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
    if (typeof child === 'function') {
      const positionMarker = document.createComment('');
      const positionMarkerIndex = parentClient.length;
      parentClient.appendChild(positionMarker);
      let previous;
      dynamic.push({
        getElement: clonedParent => {
          return clonedParent.childNodes[positionMarkerIndex];
        },
        callback(clonedPositionMarker) {
          let unmountObj;
          const boundRender = render.bind(this);
          const boundChild = child.bind(this)
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
              unmountObj = boundRender(
                clonedPositionMarker.parentNode,
                next,
                clonedPositionMarker,
                getSingleUseElementInfo
              );
            },
            { fireImmediately: true },
          );
          return {
            firstElement: () => {
              if (unmountObj) {
                const potentialFirstElement = unmountObj.firstElement();
                if(potentialFirstElement) {
                  return potentialFirstElement;
                }
              }
              return positionMarker;
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
              clonedPositionMarker.parentNode.removeChild(clonedPositionMarker);
            },
          };
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
    const template = document.createElement('template');
    template.content.appendChild(element);
    lazyTemplate = {
      template,
      get dynamic() {
        return getDynamic();
      },
    };
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
        let lazyTemplate;
        const dynamic = [];
        const element =
          component.prototype instanceof Node
            ? new component()
            : document.createElement(component);
        addStaticElements(createParentNodeClient(element), children, dynamic);
        let addedAttributeComputation = false;
        function getDynamic(index) {
          if (!addedAttributeComputation) {
            addedAttributeComputation = true;
            for(const item of dynamic) {
              const oldGetElement = item.getElement;
              item.getElement = parent => oldGetElement(parent.childNodes[index]);
            }
            dynamic.unshift({
              getElement: parent => parent.childNodes[index],
              callback(clonedElement) {
                const clonedElementCallbacks = {
                  firstElement: () => clonedElement,
                  removeChildren: () => {
                    clonedElement.parentNode.removeChild(clonedElement);
                  },
                };
                if (attributes) {
                  const disposals = [];
                  for(const key of Object.keys(attributes)) {
                    const attributeValue = attributes[key];
                    if (typeof attributeValue === 'function') {
                      const boundAttributeAssignment = attributeValue.bind(this);
                      disposals.push(reaction(
                        boundAttributeAssignment,
                        action(value => {
                          assignAttribute(clonedElement, key, value);
                        }),
                        { fireImmediately: true },
                      ));
                    } else {
                      assignAttribute(clonedElement, key, attributeValue);
                    }
                  }
                  clonedElementCallbacks.disposeReactions = () => disposals.forEach(dispose => dispose());
                }
                return clonedElementCallbacks;
              },
            });
          }
          return dynamic;
        }
        lazyData = {
          element,
          template: lazyTemplateFactory(element, () => getDynamic(0)),
          dynamic(index) {
            return getDynamic(index);
          },
        };
        return lazyData;
      },
    };
  } else {
    return component({ children, ...attributes });
  }
}
