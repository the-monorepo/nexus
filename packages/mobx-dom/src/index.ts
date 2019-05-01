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
export type ComponentResult<N extends Node = Node> =  NodeHolder<N> & { value?: ComponentReaction[] };
export type SFC<P extends {} = {}> = (props: P) => ComponentResult;
export type Component<P = {}> = SFC<P>;

export type KeyHolder<S extends string = string> = { key: S };
export type TypeHolder<T> = { type: T };
export type NodeHolder<N extends Node = Node> = { node: N};

export type DataReaction<D> = { value: D };
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

export type PropertyResult = () => any;
export type PropertyReaction = FieldReaction<PropertyResult, PropertyType>;

export type AttributeResult = () => string;
export type AttributeReaction = FieldReaction<AttributeResult, AttributeType>;

export type EventResult = () => any;
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
  value?: SubComponentFieldReaction<any>[]
};

export type NodeReaction = PropertyReaction | AttributeReaction | EventReaction;

export type NodeReactions<N extends Element = Element> = TypeHolder<NodeReactionType> & NodeHolder<N> & { value: NodeReaction[] };

export type ComponentReaction = NodeReactions | SubComponentReaction | ChildrenReaction;

export const STATIC_FIELD_TYPE = 3;
export type StaticSubComponentFieldType = typeof STATIC_FIELD_TYPE;

export const DYNAMIC_FIELD_TYPE = 4;
export type DynamicSubComponentFieldType = typeof DYNAMIC_FIELD_TYPE;

export type SubComponentFieldType = StaticSubComponentFieldType | DynamicSubComponentFieldType;

export type StaticSubComponentFieldReaction<D> = GeneralSubComponentFieldReaction<StaticSubComponentFieldType, D> & TypeHolder<StaticSubComponentFieldType>;
export type DynamicSubComponentFieldReaction<D> = GeneralSubComponentFieldReaction<DynamicSubComponentFieldType, () => D> & TypeHolder<DynamicSubComponentFieldType>;
export type SubComponentFieldReaction<D> = StaticSubComponentFieldReaction<D> | DynamicSubComponentFieldReaction<D>;

export const field = <
  T,
  D
>(fieldType: T, key: string, value: D): FieldReaction<D, T> => {
  return { type: fieldType, key, value };
}

export const children = (node: Node, value: ReactionDataCallback<ChildrenResult>): ChildrenReaction => {
  return { type: CHILDREN_TYPE, node, value };
}

export const fields = <N extends Element>(node: N, ...value: NodeReaction[]): NodeReactions<N> => {
  return { type: NODE_REACTION_TYPE, node, value };
}

export const subComponent = (
  component: Component,
  node: Node,
  childNode?: Node,
  value?: SubComponentFieldReaction<any>[]
): SubComponentReaction => {
  return { type: SUB_COMPONENT_TYPE, node, component, childNode, value };
}

export const componentRoot = <N extends Node = Node>(node: N, reactions?: ComponentReaction[]): ComponentResult<N> => {
  return {
    node,
    value: reactions,
  };
}

export const elementTemplate = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return () => document.importNode(template.content.firstChild as Node, true);
}

export type Dispose = () => void;
type Computed = {
  computedFns?: Iterable<() => void>,
};
export type RenderResult = {
  dispose?: Dispose,
} & Computed;

function runComputedFns(computedFns: Iterable<() => void>) {
  for(const computedFn of computedFns) {
    computedFn();
  }
}

function queuedInsertBefore(parent, newElement, before) {
  autorun((r) => {
    r.dispose();
    parent.insertBefore(newElement, before);
  }, { name: 'insert' });
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
    const node = document.createTextNode(result.toString());
    parent.insertBefore(node, nextMarker);
    return null;
  } else if(Array.isArray(result)) {
    if (result.length > 0) {
      // TODO: Don't forget dispose
      const childResults: (() => void)[] = [];
      const fragment = document.createDocumentFragment();
      for(const item of result) {
        // TODO: Make sure the undefined, undefined works in all cases
        const childResult = renderDynamicChildren(item, fragment, undefined, undefined);
        if (childResult && childResult.computedFns) {
          childResults.push(...childResult.computedFns);
        }
      }
      if (childResults.length > 0) {
        parent.insertBefore(fragment, nextMarker);
        return {
          computedFns: childResults,
          dispose: undefined,
        };
      }  
    }
    return null;
  } else if(result.type === OBSERVED_ARRAY_TYPE) {
    const info = result.callback(beforeMarker, nextMarker);
    return info;
  } else {
    const info = renderComponentResult(result, parent);
    return {
      computedFns: info,
      dispose: undefined,
    };
  }
}

export function initChildReaction(childrenReaction: ChildrenReaction) {
  const beforeMarker = childrenReaction.node;
  const nextMarker = childrenReaction.node.nextSibling;
  let innerDispose;
  return {
    run: returnlessComputed('child', () =>{
      if (innerDispose) {
        innerDispose();
      }
  
      removeUntilBefore(beforeMarker.nextSibling, nextMarker);
  
      const renderInfo = childrenReaction.value();
  
      const renderResults = renderDynamicChildren(
        renderInfo,
        beforeMarker.parentNode as Node,
        childrenReaction.node,
        nextMarker as Node
      );
      if (renderResults && renderResults.computedFns) {
        runComputedFns(renderResults.computedFns);
      }
      if (renderResults && renderResults.dispose) {
        innerDispose = renderResults.dispose;
      }
    })
  };
}

export function initSubComponentReaction(
  subComponentReaction: SubComponentReaction,
) {
  const props = {
    children: subComponentReaction.childNode,
  };

  // TODO: Handle overriding fields
  if(subComponentReaction.value) {
    for(const propsReaction of subComponentReaction.value) {
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
  }

  return initChildReaction({
    type: CHILDREN_TYPE,
    node: subComponentReaction.node,
    value: () => subComponentReaction.component(props)
  });
}

export const initAttributeReaction = (
  node: Element,
  { key, value }: AttributeReaction
) => {
  return returnlessComputed('attr', () => {
    const data = value();
    if (data) {
      node.setAttribute(key, data)
    } else {
      node.removeAttribute(key);
    }
  });
}


export const initPropertyReaction = (
  node: Element,
  { key, value }: PropertyReaction
) => {
  return returnlessComputed('prop', () => {
    node[key] = value();
  });
}

export const initEventReaction = (
  element: Element,
  { key, value }: EventReaction
) => {
  let removePreviousListener = () => {};
  return returnlessComputed('event', () => {
    removePreviousListener();
    const listener = value();
    if (typeof listener === 'function') {
      element.addEventListener(key, listener);
      removePreviousListener = () => element.removeEventListener(key, listener);
    } else {
      element.addEventListener(key, listener.handleEvent, listener);
      removePreviousListener = () => element.removeEventListener(key, listener.handleEvent, listener);
    }
  });
}

export function *initNodeReactions(nodeReactions: NodeReactions): Iterable<() => void> {
  for(const fieldReaction of nodeReactions.value) {
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

export const render = (renderInfo: ComponentResult, container: Node): IReactionDisposer => {
  const renderResult = renderComponentResult(renderInfo, container, undefined);
  return autorun(() => {
    runComputedFns(renderResult);
  }, { name: 'render' });
}

const alwaysTrueComparator = () => true;
const returnlessComputed = (name, fn) => {
  const wrappedFn = computed(fn, { name, equals: alwaysTrueComparator, requiresReaction: true });
  return wrappedFn.get.bind(wrappedFn);
};

export function *initComponentResult(
  renderInfo: ComponentResult
) {
  if (renderInfo.value) {
    for(const reaction of renderInfo.value) {
      switch(reaction.type) {
        case NODE_REACTION_TYPE:
          yield *initNodeReactions(reaction);
          break;
        case CHILDREN_TYPE:
          yield initChildReaction(reaction).run;
          break;
        case SUB_COMPONENT_TYPE:
          yield initSubComponentReaction(reaction).run;
          break;
      }
    }
  }
}

export const renderComponentResult = (
  componentResult: ComponentResult,
  container: Node,
  before: Node | null = null
) => {
  container.insertBefore(componentResult.node, before);
  return initComponentResult(componentResult);
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
  arr: IObservableArray<T>, mapFn: (d: T) => any) {
  // TODO: Render initial contents of array
  return {
    type: OBSERVED_ARRAY_TYPE,
    callback: (firstMarker, before): RenderResult => {
      // TODO: Should be | null
      const results: ({ dispose: Dispose, firstNode: Node })[] = [];
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
              // TODO: Needs to be reacted to
              const componentResults = changeData.added.map(mapFn);
              for(const componentResult of componentResults) {
                fragment.appendChild(componentResult.node);
              }
              for(const componentResult of componentResults) {
                const computeFns = [...initComponentResult(componentResult)];
                addedChildElements.push({
                  firstNode: componentResult.node,
                  dispose: autorun(() => runComputedFns(computeFns), { name: 'item' })
                });
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
            const stopElement = stopIndex < results.length ? results[stopIndex].firstNode : before;
            const startElement = toBeRemoved.firstNode;
            removeUntilBefore(startElement, stopElement);
            
            results.splice(changeData.index, 1);
            
            const elementToAddBefore = changeData.index < results.length ? results[changeData.index].firstNode : before;
            const componentResult = mapFn(changeData.newValue);
            const renderResult = renderComponentResult(componentResult.node, firstMarker.parentNode, elementToAddBefore);
            const autorunDispose = autorun(() => runComputedFns(renderResult), { name: 'item' });
            results.splice(changeData.index, 0, {
              firstNode: componentResult.node,
              dispose: autorunDispose,
            });
            break;
          }  
      }, true);
      return {
        computedFns: undefined,
        dispose,
      };
    }
  }
}