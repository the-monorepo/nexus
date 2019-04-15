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
      // TODO: If you've manually added some, this will delete those too which is bad
      while(this.hasChildNodes()) {
        this.removeChild(this.firstChild)
      }
    }
  }
}

const textNodeTypes = new Set(['string', 'boolean', 'number']);
type DynamicCallbacks = {
  firstElement: Node;
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
      firstElement: child,
    };
  } else if (isObservableArray(renderInfo)) {
    const firstMarker = document.createComment('');
    parent.insertBefore(firstMarker, before);
    const childElements: DynamicCallbacks[] = [];
    const dispose = renderInfo.observe(changeData => {
      if (changeData.type === 'splice') {
        if (changeData.removedCount > 0) {
          const stopIndex = changeData.index + changeData.removedCount;
          const stopElement = stopIndex < childElements.length ? childElements[stopIndex].firstElement : before;
          let currentElement = childElements[changeData.index].firstElement;
          while(currentElement !== stopElement) {
            const nextSibling = currentElement.nextSibling;
            currentElement.parentNode.removeChild(currentElement);
            currentElement = nextSibling;
          }
        }

        let addedChildElements = [];
        if (changeData.addedCount > 0) {
          const fragment = document.createDocumentFragment();

          addedChildElements = changeData.added.map((childInfo) => {
            const data = render(fragment, childInfo, undefined, thisArg);
            const firstElement = data ? data.firstElement : fragment.appendChild(document.createComment(''));
            return { disposeReactions: data.disposeReactions, firstElement }
          }).filter(data => !!data);
          const elementToAddBefore = changeData.index < childElements.length ? childElements[changeData.index].firstElement : before;
          const parentToAddTo = elementToAddBefore ? elementToAddBefore.parentNode : parent;
          parentToAddTo.insertBefore(fragment, elementToAddBefore);
        }
        
        const removed = childElements.splice(changeData.index, changeData.removedCount, ...addedChildElements);
        for (const removedChildInfo of removed) {
          if (removedChildInfo && removedChildInfo.disposeReactions) {
            removedChildInfo.disposeReactions();
          }
        }
      }
    }, true);
    return { 
      disposeReactions: () => {
        dispose();
        for(const childInfo of childElements) {
          childInfo.disposeReactions();
        }
      },
      firstElement: firstMarker,
    };
  } else if (Array.isArray(renderInfo) && renderInfo.length > 0) {
    const fragment = document.createDocumentFragment();
    const unmountObjs = renderInfo.map(item =>
      render(fragment, item, undefined, thisArg),
    );
    const firstElement = fragment.children[0];
    parent.insertBefore(fragment, before);
    return {
      disposeReactions: () => unmountObjs
        .forEach(data => {
          if (data && data.disposeReactions) {
            data.disposeReactions();
          }
        }),
      firstElement
    };
  } else {
    const info = renderInfo.renderInfo;
    const element = info.element;
    const unmountObj = info.dynamic(element, thisArg);
    parent.insertBefore(element, before);
    return unmountObj;
  }
}

function addStaticElements(parent, children, dynamic: ((...args) => DynamicCallbacks | undefined)[]) {
  for (const child of children) {
    if (typeof child === 'function') {
      const markerIndex = parent.childNodes.length;
      parent.appendChild(document.createComment(''));
      parent.appendChild(document.createComment(''));
      dynamic.push((clonedParent, thisArg) => {
        const beforeMarker = clonedParent.childNodes[markerIndex];
        const afterMarker = beforeMarker.nextSibling;
        let unmountObj;
        const boundChild = child.bind(thisArg);
        const reactionDisposer = reaction(
          boundChild,
          next => {
            let currentElement = beforeMarker.nextSibling;
            while(!currentElement.isSameNode(afterMarker)) {
              const nextElement = currentElement.nextSibling;
              clonedParent.removeChild(currentElement);
              currentElement = nextElement;
            }
            if (unmountObj && unmountObj.disposeReactions) {
                unmountObj.disposeReactions();
            }
            unmountObj = render(
              clonedParent,
              next,
              afterMarker,
              thisArg,
            );
          },
          { fireImmediately: true },
        );
        return {
          disposeReactions: () => {
            reactionDisposer();
            if (unmountObj && unmountObj.disposeReactions) {
              unmountObj.disposeReactions();
            }
          },
          firstElement: beforeMarker,
        }
      });
    } else if (textNodeTypes.has(typeof child)) {
      const element = document.createTextNode(child.toString());
      parent.appendChild(element);
    } else {
      const renderInfo = child.renderInfo;
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
    lazyTemplate = { template, dynamic: (templateContent, thisArg) => dynamicOverride(getCallbackElement(templateContent), thisArg) };
    return lazyTemplate;
  };
}

export function Fragment({ children }) {
  const element = document.createDocumentFragment();
  const childObserveFns: any[] = [];
  addStaticElements(element, children, childObserveFns);
  const dynamic = (clonedElement, thisArg) => {
      const itemsCallbacks = childObserveFns
        .map(item => item(clonedElement, thisArg))
        .filter(callback => !!callback);
      return itemsCallbacks.length <= 0 ? undefined : {
        disposeReactions: itemsCallbacks.filter(callback => !!callback.disposeReactions)
          .forEach(itemCallbacks => itemCallbacks.disposeReactions()),
        firstElement: itemsCallbacks[0].firstElement
      };
    };
  const getElementFromTemplate = (templateContent) => templateContent;
  return {
    renderInfo: {
      getElementFromTemplate,
      element,
      template: lazyTemplateFactory(element, dynamic, getElementFromTemplate),
      dynamic
    }
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

function initDynamicSetter(thisArg, dynamicValue, updateCallback): DynamicCallbacks['disposeReactions'] {
  const boundDynamicValue = dynamicValue.bind(thisArg);  
  const actionedUpdateCallback = action(updateCallback);

  let previousUnmount: DynamicCallbacks;
  
  const dispose = reaction(
    boundDynamicValue,
    (next) => {
      if (previousUnmount && previousUnmount.disposeReactions) {
        previousUnmount.disposeReactions();
      }
      previousUnmount = actionedUpdateCallback(next);
    }, 
    { fireImmediately: true }
  );
  
  return () => {
    dispose();
    if (previousUnmount && previousUnmount.disposeReactions) {
      previousUnmount.disposeReactions();
    }
  }
}

function initDynamicSetters(
  thisArg,
  dynamicFieldInfos,
  mountFactories,
): DynamicCallbacks['disposeReactions'] {
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
    if (disposal) {
      disposals.push(disposal);
    }
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
    const componentRenderInfo = component.renderInfo;
        
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

      const clonedElement = componentRenderInfo.getElementFromTemplate(clonedParent);
      return componentRenderInfo.dynamic(
        clonedElement, 
        thisReplacement            
      )
    };

    const getTemplate = () => componentRenderInfo.template(dynamic);
    return {
      renderInfo: {
        getElementFromTemplate: componentRenderInfo.getElementFromTemplate, 
        get element() { return document.importNode(componentRenderInfo.template().template.content, true) },
        template: getTemplate,
        dynamic,
      }
    };
  } else if (typeof component === 'string' || component.prototype instanceof Node) {
    const childObserveFns: ((...args) => DynamicCallbacks)[] = [];
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
        firstElement: clonedElement, 
        disposeReactions: () => {
          unmountSetters();
          for (const itemCallbacks of itemsCallbacks) {
            if (itemCallbacks && itemCallbacks.disposeReactions) {
              itemCallbacks.disposeReactions();
            }
          }
        }
      };
    }
    const getElementFromTemplate = templateContent => templateContent.childNodes[0];
    return {
      renderInfo: {
        element,
        getElementFromTemplate,
        template: lazyTemplateFactory(element, dynamic, getElementFromTemplate),
        dynamic,  
      }
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
