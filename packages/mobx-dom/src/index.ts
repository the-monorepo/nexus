import {
  reaction,
  decorate,
  action,
  computed,
  autorun,
  observable,
  isObservableArray,
  transaction,
  untracked,
  IObservableArray,
  Reaction,
  $mobx,
  toJS,
  IComputedValue,
  IReactionDisposer,
  IReactionPublic,
  IReactionOptions,
  IAutorunOptions
} from 'mobx';
export type ComponentResult<N extends Node = Node> =  NodeHolder<N> & { reactions?: ComponentReaction[] };
export type SFC<P extends {} = {}> = (props: P) => ComponentResult;
export type Component<P = {}> = SFC<P>;

export type KeyHolder<S extends string = string> = { key: S };
export type TypeHolder<T> = { type: T };
export type NodeHolder<N extends Node = Node> = { node: N};

export type DataReaction<D> = { callback: () => D };
export type FieldReaction<D, T> = DataReaction<D> & KeyHolder & TypeHolder<T>;

export type ReactionDataCallback<T = any> = () => T;

export const ATTR_TYPE = 0;
type AttributeType = typeof ATTR_TYPE;

export const PROP_TYPE = 1;
type PropertyType = typeof PROP_TYPE;

export const EVENT_TYPE = 2;
type EventType = typeof EVENT_TYPE;

export const SPREAD_TYPE = 3;
type SpreadType = typeof SPREAD_TYPE;

export type PropertyResult = any;
export type PropertyReaction = FieldReaction<PropertyResult, PropertyType>;

export type AttributeResult = any;
export type AttributeReaction = FieldReaction<AttributeResult, AttributeType>;

export type EventResult = any;
export type EventReaction = FieldReaction<EventResult, EventType>;


export const CHILDREN_TYPE = 0;
type ChildrenType = typeof CHILDREN_TYPE;

export const SUB_COMPONENT_TYPE = 1;
type SubComponentType = typeof SUB_COMPONENT_TYPE;

export const NODE_REACTION_TYPE = 2;
type NodeReactionType = typeof NODE_REACTION_TYPE;

// TODO: ComponentResult needs to be a part of this but at the moment it causes a circular reference
export type ChildrenResult = Array<any> | string | number | boolean | undefined | null | SFC | any;
export type ChildrenReaction = NodeHolder & DataReaction<ChildrenResult> & TypeHolder<ChildrenType>;

export type SubComponentResult = any;
export type GeneralSubComponentFieldReaction<T, D> = TypeHolder<T> & KeyHolder & { value: D };
export type SubComponentReaction = TypeHolder<SubComponentType> & {
  node: Node,
  component: Component,
  childNode?: Node,
  reactions: SubComponentFieldReaction<any>[]
};

export type NodeReaction = PropertyReaction | AttributeReaction | EventReaction;

export type NodeReactions<N extends Element = Element> = TypeHolder<NodeReactionType> & NodeHolder<N> & { reactions: NodeReaction[] };

export type ComponentReaction = NodeReactions | SubComponentReaction | ChildrenReaction;

const STATIC_FIELD_TYPE = 0;
export type StaticSubComponentFieldType = typeof STATIC_FIELD_TYPE;

const DYNAMIC_FIELD_TYPE = 1;
export type DynamicSubComponentFieldType = typeof DYNAMIC_FIELD_TYPE;

export type StaticSubComponentFieldReaction<D> = GeneralSubComponentFieldReaction<StaticSubComponentFieldType, D> & TypeHolder<StaticSubComponentFieldType>;
export type DynamicSubComponentFieldReaction<D> = GeneralSubComponentFieldReaction<DynamicSubComponentFieldType, () => D> & TypeHolder<DynamicSubComponentFieldType>;
export type SubComponentFieldReaction<D> = StaticSubComponentFieldReaction<D> | DynamicSubComponentFieldReaction<D>;

const assignStaticFieldToProps = action((props, key: string, value) => {
  props[key] = value;
});

const assignDynamicFieldToProps = action((props, key: string, callback) => {
  props[key] = callback();
});

export const staticField = <D>(key: string, value: D): StaticSubComponentFieldReaction<D> => {
  return { type: STATIC_FIELD_TYPE, key, value };
}

export const dynamicField = <D>(key: string, value: () => D): DynamicSubComponentFieldReaction<D> => {
  return { type: DYNAMIC_FIELD_TYPE, key, value };
}

export const fields = <N extends Element>(node: N, ...reactions: NodeReaction[]): NodeReactions<N> => {
  return { type: NODE_REACTION_TYPE, node, reactions };
}

export const attribute = (key: string, callback: ReactionDataCallback<AttributeResult>): AttributeReaction => {
  return { type: ATTR_TYPE, key, callback };
}

export const property = (key: string, callback: ReactionDataCallback<PropertyResult>): PropertyReaction => {
  return { type: PROP_TYPE, key, callback };
}

export const event = (key: string, callback: ReactionDataCallback<EventResult>): EventReaction => {
  return { type: EVENT_TYPE, key, callback };
};

export const children = (node: Node, callback: ReactionDataCallback<ChildrenResult>): ChildrenReaction => {
  return { type: CHILDREN_TYPE, node, callback };
}

export const subComponent = (
  component: Component,
  node: Node,
  childNode?: Node,
  ...reactions: SubComponentFieldReaction<any>[]
): SubComponentReaction => {
  return { type: SUB_COMPONENT_TYPE, node, component, childNode, reactions};
}

export const staticNode = <N extends Node = Node>(node: N): ComponentResult<N> => {
  return {
    node
  }
}

export const dynamicNode = <N extends Node = Node>(node: N, ...reactions: ComponentReaction[]): ComponentResult<N> => {
  return {
    node,
    reactions,
  }
}

export const elementTemplate = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return () => document.importNode(template.content.firstChild as Node, true);
}

export type Dispose = () => void;
export type RenderResult = {
  dispose?: Dispose,
  firstNode: Node,
};

const wrappedReaction = <T>(
  expression: (r: IReactionPublic) => T,
  effect: (arg: T, r: IReactionPublic) => void,
  opts?: IReactionOptions,
): IReactionDisposer | undefined => {
  return reaction(expression, effect, opts);
}

function queuedInsertBefore(parent, newElement, before) {
  reaction(() => {}, (nothing, r) => {
    r.dispose();
    parent.insertBefore(newElement, before);
  }, { fireImmediately: true })
}

const OBSERVED_ARRAY_TYPE = 0;
const textNodeTypes = ['string', 'boolean', 'number'];
function renderDynamicChildren(
  result: ChildrenResult,
  parent: Node,
  beforeMarker: Node | null = null,
  nextMarker: Node | null = null
): RenderResult | null {
  // TODO: Render functions
  if (!result) {
    return null;
  } else if (textNodeTypes.includes(typeof result)) {
    parent.insertBefore(document.createTextNode(result.toString()), nextMarker);
    return null;
  } else if(Array.isArray(result)) {
    if (result.length > 0) {
      const disposals: Dispose[] = [];
      const fragment = document.createDocumentFragment();
      for(const item of result) {
        // TODO: Make sure the undefined, undefined works in all cases
        const childResult = renderDynamicChildren(item, fragment, undefined, undefined);
        if (childResult && childResult.dispose) {
          disposals.push(childResult.dispose);
        }
      }
      if (disposals.length > 0) {
        const firstNode = fragment.childNodes[0];      
        parent.insertBefore(fragment, nextMarker);
        return {
          firstNode,
          dispose: () => {
            for(const dispose of disposals) {
              dispose();
            }
          }  
        }
      }  
    }
    return null;
  } else if(result.type === OBSERVED_ARRAY_TYPE) {
    return result.callback(beforeMarker, nextMarker);
  } else {
    return renderComponentResult(result, parent);
  }
}

function isPossiblyTrackingSomething(internalReaction: Reaction) {
  return hasEvaluatedTracking(internalReaction) ? isTrackingSomething(internalReaction) : true;
}

function hasEvaluatedTracking(internalReaction?: Reaction) {
  return internalReaction ? internalReaction._isTrackPending : false;
}

function isTrackingSomething(internalReaction: Reaction): boolean {
  return internalReaction.observing.length > 0;
}

export function initChildReaction(childrenReaction: ChildrenReaction): RenderResult {
  const beforeMarker = childrenReaction.node;
  const nextMarker = childrenReaction.node.nextSibling;
  let innerDispose: Dispose | undefined;
  const dispose = wrappedReaction(
    childrenReaction.callback,
    (renderInfo) => {
      if (innerDispose) {
        innerDispose();
      }
      let currentElement = beforeMarker.nextSibling;
      while(currentElement !== nextMarker) {
        const nextSibling = currentElement!.nextSibling;
        currentElement!.parentNode!.removeChild(currentElement!);
        currentElement = nextSibling;
      }
      const renderResults = renderDynamicChildren(
        renderInfo,
        beforeMarker.parentNode as Node,
        childrenReaction.node,
        nextMarker as Node
      );
      if(renderResults) {
        innerDispose = renderResults.dispose;
      }
    },
    { fireImmediately: true }
  );
  const firstNode = childrenReaction.node;
  
  return {
    firstNode,
    dispose: () => {
      if (dispose) {
        dispose();
      }
      if (innerDispose) {
        innerDispose();
      }
    }
  }
}

let global = 0;
export function initSubComponentReaction(
  subComponentReaction: SubComponentReaction,
): RenderResult {
  const test = global++;
  const beforeMarker = subComponentReaction.node;
  const afterMarker = beforeMarker.nextSibling;

  const props = {
    children: subComponentReaction.childNode,
  };
  // TODO: Handle overriding fields
  for(const propsReaction of subComponentReaction.reactions) {
    if (propsReaction.type === DYNAMIC_FIELD_TYPE) {
      Object.defineProperty(
        props,
        propsReaction.key,
        // TODO: I'm pretty sure computed returns a property descriptor
        computed(props, propsReaction.key, { get: propsReaction.value, configurable: false }) as any
      );
    } else {
      props[propsReaction.key] = propsReaction.value;
    }
  }

  let innerDispose: Dispose | undefined;
  const dispose = wrappedReaction(
    () => subComponentReaction.component(props),
    (renderInfo) => {
      if (innerDispose) {
        innerDispose();
      }
      removeUntilBefore(subComponentReaction.node.nextSibling, afterMarker);
      const result = renderComponentResult(
        renderInfo,
        beforeMarker.parentNode as Node, 
        afterMarker as Node
      );
      if(result) {
        innerDispose = result.dispose;
      }
    },
    { fireImmediately: true }
  );
  const firstNode = subComponentReaction.node;
  return {
    firstNode,
    dispose: () => {
      if (dispose) {
        dispose();
      }
      if(innerDispose) {
        innerDispose();
      }
    }  
  }
}

export const initAttributeReaction = (
  node: Element,
  { key, callback }: AttributeReaction
): IReactionDisposer | undefined => {
  node.setAttribute(key, callback());
  return wrappedReaction(
    callback,
    (data) => node.setAttribute(key, data),
    { fireImmediately: true }
  );
}

export const initPropertyReaction = (
  node: Element,
  { key, callback }: PropertyReaction
): IReactionDisposer | undefined => {
  node[key] = callback();
  return wrappedReaction(
    callback,
    action(data => node[key] = data),
    { fireImmediately: true }
  )
}

export const initEventReaction = (
  element: Element,
  { key, callback }: EventReaction
): Dispose | undefined => {
  let removePreviousListener: Dispose = (() => {
    const listener = callback();
    if (typeof listener === 'function') {
      element.addEventListener(key, listener);
      return () => element.removeEventListener(key, listener);
    } else {
      element.addEventListener(key, listener.handleEvent, listener);
      return () => element.removeEventListener(key, listener.handleEvent, listener);
    }
  })();
  const dispose = wrappedReaction(
    callback,
    listener => {
      removePreviousListener();
      if (typeof listener === 'function') {
        element.addEventListener(key, listener);
        return () => element.removeEventListener(key, listener);
      } else {
        element.addEventListener(key, listener.handleEvent, listener);
        return () => element.removeEventListener(key, listener.handleEvent, listener);
      }
    },
    { fireImmediately: true}
  );
  if (dispose) {
    return () => {
      dispose();
      removePreviousListener();
    }
  }
  return undefined;
}

export function *initNodeReactions(nodeReactions: NodeReactions): Iterable<Dispose> {
  for(const fieldReaction of nodeReactions.reactions) {
    switch(fieldReaction.type) {
      case ATTR_TYPE:
        const attrDispose = initAttributeReaction(nodeReactions.node, fieldReaction as AttributeReaction);
        if (attrDispose) {
          yield attrDispose;
        }
        break;
      case PROP_TYPE:
        const propDispose = initPropertyReaction(nodeReactions.node, fieldReaction as PropertyReaction)
        if(propDispose) {
          yield propDispose;
        }
        break;
      case EVENT_TYPE:
        const eventDispose = initEventReaction(nodeReactions.node, fieldReaction as EventReaction);
        if (eventDispose) {
          yield eventDispose;
        }
        break;
    }
  }
}

function initComponentResult(componentResult: ComponentResult) {
  const disposals: Dispose[] = [];
  if (componentResult.reactions) {
    for(const reaction of componentResult.reactions) {
      switch(reaction.type) {
        case CHILDREN_TYPE:
          const result = initChildReaction(reaction);
          if(result && result.dispose) {
            disposals.push(result.dispose);
          }
          break;
        case SUB_COMPONENT_TYPE:
          const subResult = initSubComponentReaction(reaction);
          if(subResult && subResult.dispose) {
            disposals.push(subResult.dispose);
          }
          break;
        case NODE_REACTION_TYPE:
          disposals.push(...initNodeReactions(reaction));
          break;
      }
    }
  }
  return {
    firstNode: componentResult.node,
    dispose: () => {
      for(const dispose of disposals) {
        dispose();
      }
    }
  };
}

export function renderComponentResult(
  componentResult: ComponentResult,
  container: Node,
  before: Node | null = null,
): RenderResult {
  container.insertBefore(componentResult.node, before);
  return initComponentResult(componentResult);
}

export const render = (renderInfo: ComponentResult, container: Node): RenderResult => {
  return renderComponentResult(renderInfo, container, undefined);
}


function removeUntilBefore(startElement, stopElement) {
  let currentElement = startElement;
  while(currentElement !== stopElement) {
    const nextSibling = currentElement.nextSibling;
    currentElement.parentNode.removeChild(currentElement);
    currentElement = nextSibling;
  }
}

function removePart(changeData, childElements: (RenderResult | any)[], before: Node | null) {
  const stopIndex = changeData.index + changeData.removedCount; 
  const stopElement = stopIndex < childElements.length ? childElements[stopIndex].firstNode : before;
  let currentElement = childElements[changeData.index].firstNode;
  while(currentElement !== stopElement) {
    const nextSibling = currentElement.nextSibling;
    currentElement.parentNode.removeChild(currentElement);
    currentElement = nextSibling;
  }
}

export function repeat<T, N extends Node>(
  arr: IObservableArray<T>, mapFn: SFC<T>) {
  // TODO: Render initial contents of array
  return {
    type: OBSERVED_ARRAY_TYPE,
    callback: (firstMarker, before) => {
      // TODO: Should be | null
      const results: (RenderResult)[] = [];
      const dispose = arr.observe((changeData) => {
        switch(changeData.type) {
          case 'splice': 
          if (changeData.removedCount > 0) {
            removePart(changeData, results, before);
          }
          const removed = results.splice(changeData.index, changeData.removedCount);
          // TODO: Should move this above removePart
          for (const removedChildInfo of removed) {
            if (removedChildInfo && removedChildInfo.dispose) {
              removedChildInfo.dispose();
            }
          }
    
          let addedChildElements: any[] = [];
          if (changeData.addedCount > 0) {
            const fragment = document.createDocumentFragment();
            const componentResults = changeData.added.map(mapFn);
            for(const componentResult of componentResults) {
              fragment.appendChild(componentResult.node);
            }
            for(const componentResult of componentResults) {
              addedChildElements.push(initComponentResult(componentResult));
            }
            // TODO: Remove !.
            const elementToAddBefore = changeData.index < results.length ? results[changeData.index]!.firstNode : before;
            queuedInsertBefore(firstMarker.parentNode, fragment, elementToAddBefore);
          }
          
          results.splice(changeData.index, 0, ...addedChildElements);
          break;
        case 'update':
          const toBeRemoved = results[changeData.index];
          if (toBeRemoved && toBeRemoved.dispose) {
            toBeRemoved.dispose();
          }
          
          const stopIndex = changeData.index + 1;
          // TODO: remove !.
          const stopElement = stopIndex < results.length ? results[stopIndex]!.firstNode : before;
          const startElement = toBeRemoved.firstNode;        
          removeUntilBefore(startElement, stopElement);
          results.splice(changeData.index, 1);
          const elementToAddBefore = changeData.index < results.length ? results[changeData.index].firstNode : before;
          const dynamicFn = renderComponentResult(mapFn(changeData.newValue), firstMarker.parentNode, elementToAddBefore);
          
          results.splice(changeData.index, 0, dynamicFn);
          break;
        }  
      }, true);    
      return dispose;
    }
  }
}