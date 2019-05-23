let nextTemplateId = 0;
const generateTemplateUid = () => nextTemplateId++;

type CloneFn<V, R> = (v: V, container: Node, before: Node | null) => R;
type Id = number | any;
type ComponentTemplate<C, V> = {
  id: Id,
  clone: CloneFn<V, C>,
  set?: SetFn<C, V>
};

const createTemplate = <C, V>(clone: CloneFn<V, C>, set?: SetFn<C, V>): ComponentTemplate<C, V> => ({
  id: generateTemplateUid(),
  clone,
  set
});

const assertNodeExists = (node) => {
  if (process.env.NODE_ENV !== 'production') {
    if (!node) {
      throw new Error(`A node was expected but received ${node} instead`);
    }
  }
}

const CHILD_TYPE = 0;
const ATTRIBUTE_TYPE = 1;
const PROPERTY_TYPE = 2;
const EVENT_TYPE = 3;

type AttributeField = {
  type: typeof ATTRIBUTE_TYPE,
  oldValue?: any,
  el: Element,
  key: string
};

export const attribute = <E extends Element = any>(el: E, key: string): AttributeField => {
  assertNodeExists(el);
  return {
    type: ATTRIBUTE_TYPE,
    el,
    oldValue: undefined,
    key
  };
}

type PropertySetter = (node: Element, value: any) => any;
type PropertyField = {
  type: typeof PROPERTY_TYPE,
  oldValue?: any,
  el: Element,
  setter: PropertySetter
}
export const property = <E extends Element = any>(el: E, setter: PropertySetter): PropertyField => {
  assertNodeExists(el);
  return {
    type: PROPERTY_TYPE,
    el,
    oldValue: undefined,
    setter
  };
}

type EventField = {
  type: typeof EVENT_TYPE,
  oldValue?: any,
  el: Element,
  key: string,
};
export const event = <E extends Element = any>(el: E, key: string): EventField => {
  assertNodeExists(el);
  return {
    type: EVENT_TYPE,
    el,
    oldValue: undefined,
    key,
  };
};

type Field = AttributeField | PropertyField | EventField | ChildrenField;
type ElementField = AttributeField | PropertyField | EventField;
type TextTemplateInput = string | boolean | number | any;
const textTemplate: ComponentTemplate<Text, TextTemplateInput> = createTemplate((initialValue: TextTemplateInput, container: Node, before: Node | null) => {
  const textNode = document.createTextNode(initialValue.toString());
  container.insertBefore(textNode, before);
  return textNode;
}, (textNode, value) => {
  textNode.textContent = value.toString();
});

const rerenderArray = (items: any[], container: Node, before: Node | null) => {
  const fragment = document.createDocumentFragment();
  const filteredItems = items.filter((v) => v != null);
  for(const item of filteredItems) {
    const itemMarker = document.createComment('');
    fragment.appendChild(itemMarker);
    renderComponentResult(item, fragment, itemMarker, null);
  }
  container.insertBefore(fragment, before);
};

const mapTemplate: ComponentTemplate<void, any[]> = createTemplate(
  (initialValue: any[], container: Node, before: Node | null) => {
    rerenderArray(initialValue, container, before);
  },
  (nothing, value, container, before) => {
    rerenderArray(value, container, before);
  }
);

const figureOutComponentResult = (
  value: any,
): typeof value extends null | undefined ? null : ComponentResult<any, typeof value> => {
  if(value == null) {
    return null;
  } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return componentResult(textTemplate, value);
  } else if (Array.isArray(value)) {
    return componentResult(mapTemplate, value);
  } else {
    return value;
  }
};

export const children = <N extends Node>(marker: N) => {
  assertNodeExists(marker);
  return {
    type: CHILD_TYPE,
    marker,
  }
}
type ChildrenField = {
  type: typeof CHILD_TYPE,
  marker: Node,
};
type FieldFactory = <E extends Node = any>(root: E) => ReadonlyArray<Field>;

export const staticElementTemplate = (
  html: string
): ComponentTemplate<void, void> => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement: Node = template.content.firstChild as Node;
  return createTemplate(
    (nothing, initialContainer: Node, initialBefore: Node | null) => {
      const cloned = document.importNode(rootElement, true)
      initialContainer.insertBefore(cloned, initialBefore);
    }
  );
}

export const elementTemplate = (
  html: string,
  fieldFactory: FieldFactory
): ComponentTemplate<ReadonlyArray<Field>, any[]> => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement: Node = template.content.firstChild as Node;
  return createTemplate(
    (initialValues: ReadonlyArray<any>, initialContainer: Node, initialBefore: Node | null) => {
      const cloned = document.importNode(rootElement, true);
      initialContainer.insertBefore(cloned, initialBefore);
      const fields = fieldFactory(cloned);
      const fieldLength = fields.length;
      for(let f = 0; f < fieldLength; f++) {
        const field = fields[f];
        const value = initialValues[f];
        if (field.type === CHILD_TYPE) {
          setChildrenField(field, value, initialBefore);
        } else {
          setElementField(field, value);
        }
      }
      return fields;
    },
    (fields, fieldValues, container, before) => {
      const fieldLength = fields.length;
      for(let f = 0; f < fieldLength; f++) {
        const field = fields[f];
        const value = fieldValues[f];
        if (field.type === CHILD_TYPE) {
          setChildrenField(field, value, before);
        } else {
          if (field.oldValue === value) {
            continue;
          }
          setElementField(field, value);
        }
      }
    }
  );
}

export const spread = (el: Element) => {
  throw new Error('Not implemented yet');
}

type ComponentResult<C, V> = {
  template: ComponentTemplate<C, V>,
  value: V,
};

export const componentResult = <C, V>(template: ComponentTemplate<C, V>, value: V): ComponentResult<C, V> => ({
  template,
  value
});


type RenderResult<C, V> = {
  templateId: Id,
  persistent: C,
};

const removeUntilBefore = (container: Node, startElement: Node | null, stopElement: Node | null) => {
  while(startElement !== stopElement) {
    const nextSibling = startElement!.nextSibling;
    container.removeChild(startElement!);
    startElement = nextSibling;
  }
}

const moveUntilBefore = (
  newContainer: Node,
  startElement: Node | null,
  stopElement: Node | null,
  before: Node | null,
) => {
  while(startElement !== stopElement) {
    const nextSibling = startElement!.nextSibling;
    newContainer.insertBefore(startElement!, before);
    startElement = nextSibling;
  }  
}

const setElementField = (field: ElementField, newValue: any) => {
  switch(field.type) {
    case ATTRIBUTE_TYPE:
      if (newValue != null) {
        field.el.setAttribute(field.key, newValue);
      } else {
        field.el.removeAttribute(field.key);
      }
      break;
    case PROPERTY_TYPE:
      field.setter(field.el, newValue);
      break;
    case EVENT_TYPE:
      if (field.oldValue != null) {
        if (typeof field.oldValue === 'function') {
          field.el.removeEventListener(field.key, field.oldValue);
        } else {
          field.el.removeEventListener(field.key, field.oldValue.handle, field.oldValue.options);
        }
      }
      if (newValue != null) {
        if (typeof newValue === 'function') {
          field.el.addEventListener(field.key, newValue);
        } else {
          field.el.addEventListener(field.key, newValue.handle, newValue.options);
        }
      }   
      break;
  }
  field.oldValue = newValue;
}

const setChildrenField = (field: ChildrenField, newValue: any, before: Node | null) => {
  const componentResult = figureOutComponentResult(newValue);
  if (componentResult) {
    checkAndRenderComponentResult(componentResult, field.marker.parentNode as Node, field.marker, before);
  } else {
    trackedNodes.delete(field.marker);
  }
}

export type KeyFn<T> = (item: T, index: number) => unknown;
export type MapFn<T, R> = (item: T, index: number) => R;
export type SetFn<C, V> = (cloneValue: C, value: V, container: Node, before: Node | null) => any;

const trackedNodes = new WeakMap<Node, RenderResult<any, any>>();

const renderComponentResultNoSet = <V>(
  renderInfo: ComponentResult<any, V>,
  container: Node,
  before: Node | null
): RenderResult<any, V> => {
  const cloneInfo = renderInfo.template.clone(renderInfo.value, container, before);
  return {
    templateId: renderInfo.template.id,
    // TODO: remove any
    persistent: cloneInfo,
  };
}

const renderComponentResult = <C, V>(
  renderInfo: ComponentResult<C, V>,
  container: Node,
  trackerNode: Node,
  before: Node | null
): RenderResult<C, V> => {
  const result: RenderResult<C, V> = renderComponentResultNoSet(renderInfo, container, before);
  trackedNodes.set(trackerNode, result);
  return result;
}

const isReusableRenderResult = (componentResult: ComponentResult<any, any>, renderResult: RenderResult<any, any>) => {
  return renderResult.templateId === componentResult.template.id;
};

const checkAndRenderComponentResult = <C, V>(
  renderInfo: ComponentResult<C, V>,
  container: Node,
  trackerNode: Node,
  before: Node | null
) => {
  const oldResult = trackedNodes.get(trackerNode);
  if (oldResult) {
    if (isReusableRenderResult(renderInfo, oldResult)) {
      if (renderInfo.template.set !== undefined) {
        renderInfo.template.set(oldResult.persistent, renderInfo.value, container, before);        
      }
    } else {
      removeUntilBefore(container, trackerNode, before);
      const result = renderComponentResult(renderInfo, container, trackerNode, before);
      trackedNodes.set(trackerNode, result);
    }
  } else {
    const result = renderComponentResult(renderInfo, container, trackerNode, before);
    trackedNodes.set(trackerNode, result);
  }
}

export const render = <C, V>(value: ComponentResult<C, V>, container: Node) => {
  return checkAndRenderComponentResult(value, container, container, null);
}

export type ItemTemplate<T> = (item: T, index: number) => unknown;

const removePart = <C, R>(markerIndex: number, oldResults: RepeatItemData<C, R>[], container: Node, before: Node | null) => {
  const marker = oldResults[markerIndex].marker;
  removeUntilBefore(container, marker as Node, before);
};

// Helper for generating a map of array item to its index over a subset
// of an array (used to lazily generate `newKeyToIndexMap` and
// `oldKeyToIndexMap`)
const generateMap = (list: unknown[], start: number, end: number) => {
  const map = new Map();
  for (let i = start; i <= end; i++) {
    map.set(list[i], i);
  }
  return map;
};

type RepeatTemplateInput<V, C, R> = {
  values: Iterable<V>,
  mapFn: MapFn<V, ComponentResult<C, R>>,
  keyFn: KeyFn<V>,
};

type RepeatItemData<C, R> = {
  key: unknown,
  marker: Comment,
  result: RenderResult<C, R>,
}

type RepeatComponentData<C, R> = {
  key: unknown,
  result: ComponentResult<C, R>,
}

const repeatItemData = <C, R>(key: unknown, marker: Comment, result: RenderResult<C, R>): RepeatItemData<C, R> => ({
  key,
  marker,
  result,
});

const insertPartBefore = (
  newResults: RepeatComponentData<unknown, unknown>[],
  insertionIndex: number,
  container: Node,
  before: Node | null
) => {
  const newResult = newResults[insertionIndex];
  const newMarker = document.createComment('');
  // No old part for this value; create a new one and
  // insert it
  container.insertBefore(newMarker, before);
  return repeatItemData(newResult.key, newMarker, renderComponentResultNoSet(newResult.result, container, before));
};

const renderRepeatItem = <C, R>(
  oldResult: RepeatItemData<C, R>,
  newResult: RepeatComponentData<C, R>,
  container: Node,
  before: Node | null,
) => {
  if (isReusableRenderResult(newResult.result, oldResult.result)) {
    if (newResult.result.template.set !== undefined) {
      newResult.result.template.set(oldResult.result.persistent, newResult.result.value, container, before);
    }
    return oldResult;
  } else {
    const nodeAfterMarker = oldResult.marker.nextSibling;
    removeUntilBefore(container, nodeAfterMarker, before);
    const renderResult = renderComponentResultNoSet(newResult.result, container, before);
    return repeatItemData(newResult.key, oldResult.marker, renderResult);
  }
}

const movePart = (
  insertionFragment: DocumentFragment,
  oldResults: RepeatItemData<any, any>[],
  newResults: RepeatComponentData<any, any>[],
  oldIndex: number,
  newIndex: number,
  container: Node,
  oldNextMarker: Node | null,
  before: Node | null
) => {
  const newResult = newResults[newIndex];

  const oldResult = oldResults[oldIndex];
  
  if (isReusableRenderResult(newResult.result, oldResult.result)) {
    moveUntilBefore(
      insertionFragment,
      oldResult.marker,
      oldNextMarker,
      before
    );
    if (newResult.result.template.set) {
      newResult.result.template.set(oldResult.result.persistent, newResult.result.value, insertionFragment, before);
    }
    return oldResult;
  } else {
    const nodeAfterMarker = oldResult.marker.nextSibling;
    removeUntilBefore(container, nodeAfterMarker, oldNextMarker);
    insertionFragment.insertBefore(oldResult.marker, before);
    const renderResult = renderComponentResultNoSet(newResult.result, insertionFragment, before);
    return repeatItemData(newResult.key, oldResult.marker, renderResult);
  }
}

type RepeatTemplateCache<C, R> = {
  oldResults: (RepeatItemData<C, R> | null)[]
}
const NO_SIDE = 0;
const LEFT_SIDE = 1;
const RIGHT_SIDE = 2;
type Side = typeof NO_SIDE | typeof LEFT_SIDE | typeof RIGHT_SIDE;

const getLeftSideInsertBefore = (oldResults: (RepeatItemData<any, any> | null)[], oldHead: number, oldLength: number, before: Node | null): Node | null => {
  return oldHead + 1 >= oldLength ? before : oldResults[oldHead + 1]!.marker;
}
const getRightSideInsertBefore = (newTail: number, newRenderResults: RepeatItemData<any, any>[]): Node | null => {
  return newRenderResults[newTail]!.marker;
}

const repeatTemplate = createTemplate(
  (initialInput: RepeatTemplateInput<any, any, any>, initialContainer, before) => {
  let oldResults: (RepeatItemData<any, any> | null)[] = [];
  (() => {
    const fragment = document.createDocumentFragment();
    let i = 0;
    for(const itemData of initialInput.values) {
      const componentResult = figureOutComponentResult(initialInput.mapFn(itemData, i));
      if (componentResult !== null) {
        const key = initialInput.keyFn(itemData, i);
        const marker = document.createComment('');
        fragment.appendChild(marker);
        const result = renderComponentResultNoSet(itemData.result, fragment, null);
        oldResults.push(repeatItemData(key, marker, result));  
      }
      i++;
    }
  
    initialContainer.insertBefore(fragment, before);  
  })();
  const state: RepeatTemplateCache<any, any> = {oldResults};
  return state;
},
(state: RepeatTemplateCache<any, any>, newInput: RepeatTemplateInput<any, any, any>, container: Node, before: Node | null) => {
  const oldResults = state.oldResults;
    const newComponentResults: RepeatComponentData<any, any>[] = [];
    
    let i = 0;
    for(const itemValue of newInput.values) {
      const componentResult = figureOutComponentResult(newInput.mapFn(itemValue, i));
      if (componentResult !== null) {
        const key = newInput.keyFn(itemValue, i);
        newComponentResults.push({ key, result: componentResult });  
      }
      i++;
    }
    const oldLength = oldResults.length;
    const newLength = newComponentResults.length;

    const newRenderResults: RepeatItemData<any, any>[] = [];

    const leftFragment: DocumentFragment = document.createDocumentFragment();
    const rightFragment: DocumentFragment = document.createDocumentFragment();

    // Maps from key to index for current and previous update; these
    // are generated lazily only when needed as a performance
    // optimization, since they are only required for multiple
    // non-contiguous changes in the list, which are less common.
    let newKeyToIndexMap!: Map<unknown, number>;
    let oldKeyToIndexMap!: Map<unknown, number>;

    // Head and tail pointers to old parts and new values
    let oldHead = 0;
    let oldTail = oldLength - 1;

    let newHead = 0;
    let newTail = newLength - 1;

    let insertRightBefore: Node | null = before;

    while (oldHead <= oldTail && newHead <= newTail) {
      if (oldResults[oldHead] === null) {
        // `null` means old part at head has already been used
        // below; skip
        oldHead++;
      } else if (oldResults[oldTail] === null) {
        // `null` means old part at tail has already been used
        // below; skip
        oldTail--;
      } else if (oldResults[oldHead]!.key === newComponentResults[newHead].key) {
        // Old head matches new head; update in place
        const markerToAddBefore = oldHead + 1 >= oldLength ? before : oldResults[oldHead + 1]!.marker;
        const markerToAddFragmentBefore = oldResults[oldHead]!.marker;
        container.insertBefore(leftFragment, markerToAddFragmentBefore);
        newRenderResults[newHead] = renderRepeatItem(oldResults[oldHead]!, newComponentResults[newHead], container, markerToAddBefore);
        oldHead++;
        newHead++;
        if ()
      } else if (oldResults[oldTail]!.key === newComponentResults[newTail].key) {
        // Old tail matches new tail; update in place
        newRenderResults[newTail] = renderRepeatItem(oldResults[oldTail]!, newComponentResults[newTail], container, insertRightBefore);
        container.insertBefore(rightFragment, insertRightBefore);
        insertRightBefore = newRenderResults[newTail].marker;
        oldTail--;
        newTail--;
      } else if (oldResults[oldHead]!.key === newComponentResults[newTail].key) {
        const rightBefore = oldResults[oldHead + 1]!.marker;
        // Old head matches new tail; update and move to new tail
        newRenderResults[newTail] = movePart(
          rightFragment,
          oldResults as any,
          newComponentResults,
          oldHead,
          newTail,
          container,
          rightBefore,
          rightFragment.firstChild
        );
        oldHead++;
        newTail--;
      } else if (oldResults[oldTail]!.key === newComponentResults[newHead].key) {
        // Old tail matches new head; update and move to new head
        newRenderResults[newHead] = movePart(
          leftFragment,
          oldResults as any,
          newComponentResults,
          oldTail,
          newHead,
          container,
          insertRightBefore,
          null
        );
        oldTail--;
        newHead++;
      } else {
        if (newKeyToIndexMap === undefined) {
          // Lazily generate key-to-index maps, used for removals &
          // moves below
          newKeyToIndexMap = generateMap(newComponentResults, newHead, newTail);
          oldKeyToIndexMap = generateMap(oldResults, oldHead, oldTail);
        }
        if (!newKeyToIndexMap.has(oldResults[oldHead]!.key)) {
          const oldNextMarker = oldHead + 1 < oldLength ? oldResults[oldHead + 1]!.marker : before;
          container.insertBefore(leftFragment, oldNextMarker);
          if (!oldKeyToIndexMap.has(newComponentResults[newHead].key) && isReusableRenderResult(newComponentResults[newHead].result, oldResults[oldHead]!.result)) {
            // The new head and old head don't exist in each other's lists but they share the same template; reuse
            newRenderResults[newHead] = renderRepeatItem(oldResults[oldHead]!, newComponentResults[newHead], container, oldNextMarker);
            newHead++;
          } else {
            // Old head is no longer in new list; remove
            removePart(oldHead, oldResults as any, container, oldNextMarker);
          }
          oldHead++;
        } else if (!newKeyToIndexMap.has(oldResults[oldTail]!.key)) {
          if (!oldKeyToIndexMap.has(newComponentResults[newTail].key) && isReusableRenderResult(newComponentResults[newTail].result, oldResults[oldTail]!.result)) {
            // The new tail and old tail don't exist in each other's lists but they share the same template; reuse
            newRenderResults[newTail] = renderRepeatItem(oldResults[oldTail]!, newComponentResults[newTail], container, insertRightBefore);
            container.insertBefore(rightFragment, insertRightBefore);
            insertRightBefore = newRenderResults[newTail].marker;
            newTail--;
          } else {
            // Old tail is no longer in new list; remove
            removePart(oldTail, oldResults as any, container, insertRightBefore);
          }
          oldTail--;
        } else {
          // Any mismatches at this point are due to additions or
          // moves; see if we have an old part we can reuse and move
          // into place
          const oldIndex = oldKeyToIndexMap.get(newComponentResults[newHead].key);
          if (oldIndex === undefined) {
            newRenderResults[newHead] = insertPartBefore(
              newComponentResults,
              newHead,
              leftFragment,
              null
            );
          } else {
            newRenderResults[newHead] = movePart(
              leftFragment,
              oldResults as any,
              newComponentResults,
              oldIndex,
              newHead,
              container,
              oldResults[oldIndex]!.marker,
              null
            );
            oldResults[oldIndex] = null;
          }
          newHead++;
        }
      }
    }
    // Add parts for any remaining new values
    while (newHead <= newTail) {      
      newRenderResults[newHead] = insertPartBefore(
        newComponentResults,
        newHead,
        leftFragment,
        null
      );
      newHead++;
    }
    leftFragment.appendChild(rightFragment);
    container.insertBefore(leftFragment, insertRightBefore);
    if (oldHead <= oldTail) {
      const firstToRemoveMarker = oldResults[oldHead]!.marker;
      const lastToRemoveMarker = newTail + 1 < newLength ? newRenderResults[newTail + 1]!.marker : before;
      removeUntilBefore(container, firstToRemoveMarker, lastToRemoveMarker);
    }
    state.oldResults = newRenderResults;
  }
);

export const repeat = <V, C, R, CR extends ComponentResult<C, R>>(values: Iterable<V>, keyFn: KeyFn<V>, mapFn: MapFn<V, CR>): ComponentResult<RepeatTemplateCache<C, R>, RepeatTemplateInput<V, C, R>> => {
  return {
    template: repeatTemplate,
    value: { values, keyFn, mapFn }
  };
}

export type SFC<P, R> = (props: P) => R;
export type StateSetter<S> = (state: S) => void;
export type StatefulComponent<P, S, R> = (props: P, statePatch: S, setState: StateSetter<S>) => R;
type InternalState<S, C, V> = {
  previousRenderResult: RenderResult<C, V> | null,
  readonly state: S,
  readonly setState: (statePatch: Partial<S>) => void
};
export const withState = <C, P, S extends {}, R>(
  sfcWithState: StatefulComponent<P, S, R>,
  initialState: S
): SFC<P, ComponentResult<InternalState<S, C, R>, P>> => {
  const stateTemplate = createTemplate((initialProps: P, container, before) => {
    const state = Object.create(initialState);
    const setState = (statePatch) => {
      Object.assign(state, statePatch);
    };
    const initialComponentResult = figureOutComponentResult(sfcWithState(initialProps, state, setState));
    const previousRenderResult: RenderResult<C, P> | null = initialComponentResult !== null ? renderComponentResultNoSet(initialComponentResult, container, before) : null;
    const internalState: InternalState<S, C, R> =  { previousRenderResult, state, setState };
    return internalState;
  }, (internalState, props, container, before) => {
    const { previousRenderResult, state, setState } = internalState;
    const componentResult = figureOutComponentResult(sfcWithState(props, state, setState));
    if (componentResult) {
      if (previousRenderResult !== null && isReusableRenderResult(componentResult, previousRenderResult)) {
        if (componentResult.template.set) {
          componentResult.template.set(previousRenderResult.persistent, props, container, before);
        }
      } else {
        internalState.previousRenderResult = renderComponentResultNoSet(componentResult, container, before);
      }
    } else {
      internalState.previousRenderResult = null;
    }
  });
  return (props: P) => ({
    template: stateTemplate,
    value: props
  })
};