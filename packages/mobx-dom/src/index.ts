import {
  reaction,
  decorate,
  action,
  computed,
  observable,
  isObservableArray,
  IObservableArray,
  toJS
} from 'mobx';
const node = <T>(value: T): ContainerNode<T> => ({
  value,
});

type DynamicSection<T extends Node = Node, This = any> 
  = ((clonedNode: T, thisArg: This) => (DynamicCallbacks | null));

type ContainerNode<T> = {
  next?: ContainerNode<T>;
  value: T;
}


class ChildHooksContainer<T> implements Iterable<T> {
  private head?: ContainerNode<T>;
  private tail?: ContainerNode<T>;
  private handleNoHead(value: T, callback: (newNode: ContainerNode<T>) => void) {
    const newNode = node(value);
    if (this.head) {
      callback(newNode);
    } else {
      this.head = newNode;
      this.tail = newNode;
    }
  }

  public unshift(value) {
    this.handleNoHead(value, (newNode) => {
      newNode.next = this.head;
      this.head = newNode;
    })
  }

  public push(value) {
    this.handleNoHead(value, (newNode) => {
      this.tail!.next = newNode;
      this.tail = newNode;
    })
  }

  *[Symbol.iterator]() {
    let current = this.head;
    while(current) {
      yield current.value;
      current = current.next;
    }
  }

  get isEmpty(): boolean {
    return this.head === undefined;
  }
}

export abstract class MobxElement extends HTMLElement {
  private readonly shadow;
  private unmountObj;
  public static template: any;
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.unmountObj = render(this.shadow, (this.constructor as any).template, undefined, this);
  }

  disconnectedCallback() {
    // TODO: Maybe just dispose of reactions and recreate them on connectedCallback
    if (this.unmountObj) {
      if (this.unmountObj.disposeReactions) {
        this.unmountObj.disposeReactions();
      }
      // TODO: If you've manually added some, this will delete those too which is bad
      while(this.hasChildNodes()) {
        this.removeChild(this.firstChild as Node);
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
  if (!parent) {
    throw new Error('Parent was not defined');
  }
  if (renderInfo === undefined || renderInfo === null) {
    return undefined;
  } else if (textNodeTypes.has(typeof renderInfo)) {
    const child = document.createTextNode(renderInfo);
    parent.insertBefore(child, before);
    return {
      firstElement: child,
    };
  } else if (Array.isArray(renderInfo)) {
    const fragment = document.createDocumentFragment();
    const unmountObjs = renderInfo.map(item =>
      render(fragment, item, undefined, thisArg),
    );
    if (fragment.children.length > 0) {
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
      return undefined;
    }
  } else {
    const info = renderInfo.renderInfo;
    const element = info.element;
    const unmountObj = info.dynamic(element, thisArg);
    parent.insertBefore(element, before);
    return unmountObj;
  }
}

function initFunctionalChild(parent: Node, child) {
  const markerIndex = parent.childNodes.length;
  parent.appendChild(document.createComment(''));
  return (clonedParent, thisArg) => {
    const beforeMarker = clonedParent.childNodes[markerIndex];
    const afterMarker = beforeMarker.nextSibling;
    let unmountObj;
    const boundChild = child.bind(thisArg);
    const reactionDisposer = reaction(
      boundChild,
      nextRenderInfo => {
        removeUntilBefore(beforeMarker.nextSibling, afterMarker);
        if (unmountObj && unmountObj.disposeReactions) {
            unmountObj.disposeReactions();
        }
        unmountObj = render(
          clonedParent,
          nextRenderInfo,
          afterMarker,
          thisArg,
        );
      },
      { fireImmediately: true }
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
  };
}
  
function addStaticElements(parent, children, dynamic: ChildHooksContainer<DynamicSection>) {
  for (const child of children) {
    if (typeof child === 'function') {
      const dynamicFn = initFunctionalChild(parent, child);
      dynamic.unshift(dynamicFn);
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
      dynamic.unshift(childDynamic);
    }
  }
}

interface TemplateInfo {
  template: HTMLTemplateElement;
  dynamic: DynamicSection<HTMLTemplateElement>;
}
function lazyTemplateFactory(
  element: Node,
  dynamic,
  getCallbackElement
): () => TemplateInfo {
  let getTemplate = (dynamicOverride = dynamic) => {
    const template = document.createElement('template');
    template.content.appendChild(element);
    const lazyTemplate = { template, dynamic: (templateContent, thisArg) => dynamicOverride(getCallbackElement(templateContent), thisArg) };
    getTemplate = () => lazyTemplate;
    return lazyTemplate;
  };
  return getTemplate;
}

interface RenderInfo<T extends Node = Node> {
  readonly element: T,
  getElementFromTemplate(templateContent: DocumentFragment): Node,
  template(dynamicOverride?): TemplateInfo;
  readonly dynamic: DynamicSection<T>,
}

interface RenderInfoContainer<T extends Node = Node> {
  renderInfo: RenderInfo<T>;
}

export function Fragment({ children }): RenderInfoContainer<DocumentFragment> {
  const element = document.createDocumentFragment();
  const childObserveFns = new ChildHooksContainer<DynamicSection>();
  addStaticElements(element, children, childObserveFns);
  const dynamic: DynamicSection<DocumentFragment> = (clonedElement, thisArg): DynamicCallbacks | null  => {
    const itemsCallbacks: DynamicCallbacks[] = [];
    for(const dynamicFn of childObserveFns) {
      const childCallbacks = dynamicFn(clonedElement, thisArg);
      if (childCallbacks) {
        itemsCallbacks.push(childCallbacks);
      }
    }
    return itemsCallbacks.length <= 0 ? null : {
      disposeReactions: () => itemsCallbacks.filter(callback => !!callback.disposeReactions)
        .forEach(itemCallbacks => itemCallbacks.disposeReactions!()),
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

type DynamicField = {
  type: typeof ATTR_TYPE | typeof PROP_TYPE | typeof EVENT_TYPE;
  name: string;
  callback: DynamicSection;
}

type FieldInfo = {
  dynamicFields: DynamicField[];
  staticAttrs: {
    [s: string]: any,
  },
  staticProps: {
    [s: string]: any,
  }
}
// TODO: Transpile this in babel
function extractFieldInfo(jsxAttributeObj): FieldInfo {
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
    if (disposal) {
      disposals.push(disposal);
    }
  }  
  return disposals;
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

class ElementDynamicCallbacks {
  constructor(
    public readonly firstElement: Node,
    private readonly unmountSetters: (() => void)[],
    public readonly childDynamicCallbacks: Iterable<DynamicCallbacks>,
  ) {}
  disposeReactions() {
    this.unmountSetters.forEach(unmountSetter => unmountSetter());
    for (const itemCallbacks of this.childDynamicCallbacks) {
      if (itemCallbacks.disposeReactions) {
        itemCallbacks.disposeReactions();
      }
    }
  }
}

class ElementRenderInfo implements RenderInfo {
  constructor(
    public readonly element: Node,
    private readonly fieldInfo: FieldInfo,
    private readonly dynamicCallbacks: ChildHooksContainer<DynamicSection>,
  ) {}
  public readonly template = lazyTemplateFactory(this.element, this.dynamic, this.getElementFromTemplate);
  
  getElementFromTemplate(templateContent: DocumentFragment): Node {
    return templateContent.childNodes[0];
  }

  dynamic(clonedElement, thisArg) {
    for(const name in this.fieldInfo.staticProps) {
      clonedElement[name] = this.fieldInfo.staticProps[name];
    }

    const unmountSetters = initDynamicSettersForElement(
      clonedElement,
      thisArg,
      this.fieldInfo.dynamicFields,
    );

    const itemsCallbacks: any[] = [];
    for(const itemCallbacks of this.dynamicCallbacks) {
      itemsCallbacks.push(itemCallbacks(clonedElement, thisArg));
    }  

    return new ElementDynamicCallbacks(
      clonedElement,
      unmountSetters,
      itemsCallbacks
    );
  }
}

class StaticComponentRenderInfo implements RenderInfo {
  constructor(
    private readonly children,
    private readonly staticFields: { [s: string]: any },
    private readonly dynamicFields: { key, value: () => any }[],
    private readonly componentRenderInfo: RenderInfo
  ) {}

  template() {
    return this.componentRenderInfo.template(this.dynamic);
  }f

  get element() { 
    return document.importNode(this.componentRenderInfo.template().template.content, true);
  }

  getElementFromTemplate(templateContent: DocumentFragment): Node {
    return this.componentRenderInfo.getElementFromTemplate(templateContent);
  }

  dynamic(clonedParent, thisArg) {
    const wrappedChildren = this.children.map(child => {
      if (typeof child === 'function') {
        return child.bind(thisArg);
      }
      return child;
    });
    
    const props = Object.create(this.staticFields);
    const thisReplacement = { props };
    thisReplacement.props.children = thisReplacement.props.children || wrappedChildren;

    for(const {key, value} of this.dynamicFields) {
      value.bind(thisArg);
      Object.defineProperty(props, key, { get: value });
    }

    const clonedElement = this.componentRenderInfo.getElementFromTemplate(clonedParent);
    return this.componentRenderInfo.dynamic(
      clonedElement, 
      thisReplacement            
    )
  }
}

export function createElement(
  component: any | HTMLElement,
  jsxAttributeObj: { [s: string]: any } = {},
  ...children
): RenderInfoContainer {
  if(component.renderInfo) {    
    const componentRenderInfo = component.renderInfo;
    const staticFields = {};
    const dynamicFields: { key: string, value: () => any }[] = [];
    for(const key in jsxAttributeObj) {
      const value = jsxAttributeObj[key];
      if (typeof value === 'function') {
        dynamicFields.push({ key, value });
      } else {
        staticFields[key] = value;
      }
    }
    return {
      renderInfo: new StaticComponentRenderInfo(children, staticFields, dynamicFields, componentRenderInfo),
    };
  } else if (typeof component === 'string' || component.prototype instanceof Node) {
    const fieldInfo = extractFieldInfo(jsxAttributeObj);
    const childObserveFns = new ChildHooksContainer<DynamicSection>();
    const element =
      component.prototype instanceof HTMLElement
        ? new component()
        : document.createElement(component);
    addStaticElements(element, children, childObserveFns);
    addStaticAttributes(element, fieldInfo.staticAttrs);
    return {
      renderInfo: new ElementRenderInfo(
        element,
        fieldInfo,
        childObserveFns
      )
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
    return component({ children, ...unwrappedAttributes });
  }
}

function removeUntilBefore(startElement, stopElement) {
  let currentElement = startElement;
  while(currentElement !== stopElement) {
    const nextSibling = currentElement.nextSibling;
    currentElement.parentNode.removeChild(currentElement);
    currentElement = nextSibling;
  }
}

function removePart(changeData, childElements, before) {
  const stopIndex = changeData.index + changeData.removedCount; 
  const stopElement = stopIndex < childElements.length ? childElements[stopIndex].firstElement : before;
  let currentElement = childElements[changeData.index].firstElement;
  while(currentElement !== stopElement) {
    const nextSibling = currentElement.nextSibling;
    currentElement.parentNode.removeChild(currentElement);
    currentElement = nextSibling;
  }
}

export function repeat<T>(arr: IObservableArray<T>, mapFn: (value: T) => RenderInfo) {
  const marker = document.createComment('');
  const dynamic = (firstMarker, thisArg) => {
    const before = firstMarker.nextSibling;
    // TODO
    const childElements: (DynamicCallbacks | any)[] = [];
    const dispose = arr.observe((changeData) => {
      switch(changeData.type) {
        case 'splice': 
          if (changeData.removedCount > 0) {
            removePart(changeData, childElements, before);
          }
          const removed = childElements.splice(changeData.index, changeData.removedCount);
          // TODO: Should move this ambove removePart
          for (const removedChildInfo of removed) {
            if (removedChildInfo && removedChildInfo.disposeReactions) {
              removedChildInfo.disposeReactions();
            }
          }
    
          let addedChildElements: any[] = [];
          if (changeData.addedCount > 0) {
            const fragment = document.createDocumentFragment();

            addedChildElements = changeData.added.map((data) => {
              const dyanmicFn = render(fragment, mapFn(data), undefined, thisArg);
              return dyanmicFn;
            });
            const elementToAddBefore = changeData.index < childElements.length ? childElements[changeData.index].firstElement : before;
            firstMarker.parentNode.insertBefore(fragment, elementToAddBefore);
          }
          
          childElements.splice(changeData.index, 0, ...addedChildElements);
          break;
        case 'update':
          const toBeRemoved = childElements[changeData.index];
          if (toBeRemoved && toBeRemoved.disposeReactions) {
            toBeRemoved.disposeReactions();
          }
          
          const stopIndex = changeData.index + 1;
          const stopElement = stopIndex < childElements.length ? childElements[stopIndex].firstElement : before;
          const startElement = toBeRemoved.firstElement;        
          removeUntilBefore(startElement, stopElement);
          childElements.splice(changeData.index, 1);
          const elementToAddBefore = changeData.index < childElements.length ? childElements[changeData.index].firstElement : before;
          const dynamicFn = render(firstMarker.parentNode, mapFn(changeData.newValue), elementToAddBefore, thisArg);
          
          childElements.splice(changeData.index, 0, dynamicFn);
          break;
      }
    });
    return {
      disposeReactions: () => {
        dispose();
        for(const childInfo of childElements) {
          if(childInfo && childInfo.disposeReactions) {
            childInfo.disposeReactions();
          }
        }
      }
    };
  }
  return {
    renderInfo: {
      template: lazyTemplateFactory(marker, dynamic, (templateContent) => templateContent.childNodes[0]),
      element: marker,
      dynamic
    }
  }
}
