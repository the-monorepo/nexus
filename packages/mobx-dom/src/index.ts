let nextTemplateId = 0;
const generateTemplateUid = () => nextTemplateId++;

type CloneFn<V> = (v: V, container: Node, before: Node | null) => CloneInfo<V>;
type Id = number | any;
type ComponentTemplate<V> = {
  id: Id,
  clone: CloneFn<V>,
};

const createTemplate = <V>(clone: CloneFn<V>): ComponentTemplate<V> => ({
  id: generateTemplateUid(),
  clone,
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

export const attribute = <E extends Element = any>(el: E, key: string) => {
  assertNodeExists(el);
  return {
    type: ATTRIBUTE_TYPE,
    oldValue: undefined,
    el,
    key
  };
}

type PropertySetter = (value: any) => void;
type PropertyField = {
  type: typeof PROPERTY_TYPE,
  oldValue?: any,
  setter: PropertySetter
}
export const property = (setter: PropertySetter): PropertyField => {
  return {
    type: PROPERTY_TYPE,
    oldValue: undefined,
    setter,
  }
};

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
    oldValue: undefined,
    el,
    key,
  };
};

type Field = AttributeField | PropertyField | EventField | ChildrenField;

type TextTemplateInput = string | boolean | number | any;
const textTemplate: ComponentTemplate<TextTemplateInput> = createTemplate((initialValue: TextTemplateInput, container: Node, before: Node | null) => {
  const textNode = document.createTextNode(initialValue.toString());
  container.insertBefore(textNode, before);
  return (value: TextTemplateInput) => {
    textNode.data = value.toString();
  };
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

const mapTemplate: ComponentTemplate<any[]> = createTemplate((initialValue: any[], container: Node, before: Node | null) => {
  rerenderArray(initialValue, container, before);
  return (value: any[]) => {
    rerenderArray(value, container, before);
  };
});

const figureOutComponentResult = (
  value: any,
): typeof value extends null | undefined ? null : ComponentResult<any> => {
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
export const elementTemplate = (
  html: string,
  fieldFactory?: FieldFactory
): ComponentTemplate<typeof fieldFactory extends undefined ? undefined : any[]> => {

  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement: Node = template.content.firstChild as Node;
  return createTemplate(
    (initialValues: ReadonlyArray<any>, initialContainer: Node, initialBefore: Node | null) => {
      const cloned = document.importNode(rootElement, true);
      initialContainer.insertBefore(cloned, initialBefore);
      if (fieldFactory !== undefined) {
        const fields = fieldFactory(cloned);
        setFieldValues(fields, initialValues, initialBefore);
        return (fieldValues: any[], container, before: Node | null) => {
          setFieldValues(fields, fieldValues, before);
        };
      } else {
        return undefined;
      }
    },
  );
}

export const spread = (el: Element) => {
  throw new Error('Not implemented yet');
}

type ComponentResult<V> = {
  template: ComponentTemplate<V>,
  value: V,
};

export const componentResult = <V>(template: ComponentTemplate<V>, value: V): ComponentResult<V> => ({
  template,
  value
});


type RenderResult<V> = {
  templateId: Id,
  set?: SetFn<V>,
};

const removeUntilBefore = (container: Node, startElement: Node, stopElement: Node | null) => {
  let currentElement = startElement;
  while(currentElement !== stopElement) {
    const nextSibling = currentElement.nextSibling!;
    container.removeChild(currentElement);
    currentElement = nextSibling;
  }
}

const extractUntilBefore = (startElement: Node, stopElement: Node | null) => {
  const fragment = document.createDocumentFragment();
  let currentElement = startElement;
  while(currentElement !== stopElement) {
    const nextSibling = currentElement.nextSibling!;
    fragment.appendChild(currentElement);
    currentElement = nextSibling;
  }  
  return fragment;
}

const setFieldValues = (
  fields: ReadonlyArray<Field>,
  fieldValues: ReadonlyArray<any>,
  before: Node | null
) => {
  for(let f = 0; f < fieldValues.length; f++) {
    const field = fields[f];
    const newValue = fieldValues[f];
    switch(field.type) {
      case PROPERTY_TYPE:
      case EVENT_TYPE:
      case ATTRIBUTE_TYPE:
        if (field.oldValue === newValue) {
          break;
        }
        switch(field.type) {
          case ATTRIBUTE_TYPE:
            if (newValue != null) {
              field.el.setAttribute(field.key, newValue);
            } else {
              field.el.removeAttribute(field.key);
            }
            break;
          case PROPERTY_TYPE:
            field.setter(newValue);
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
        break;
      case CHILD_TYPE:
        const componentResult = figureOutComponentResult(newValue);
        if (componentResult) {
          checkAndRenderComponentResult(componentResult, field.marker.parentNode as Node, field.marker, before);
        } else {
          trackedNodes.delete(field.marker);
        }
        break;        
    }
  }
};

export type KeyFn<T> = (item: T, index: number) => unknown;
export type MapFn<T, R> = (item: T, index: number) => R;
export type SetFn<V> = (value: V, container: Node, before: Node | null) => any;
type CloneInfo<V> = SetFn<V> | undefined;

const trackedNodes = new WeakMap<Node, RenderResult<any>>();

const renderComponentResultNoSet = <V>(
  renderInfo: ComponentResult<V>,
  container: Node,
  before: Node | null
): RenderResult<V> => {
  const cloneInfo = renderInfo.template.clone(renderInfo.value, container, before);
  return {
    templateId: renderInfo.template.id,
    // TODO: remove any
    set: cloneInfo,
  };
}

const renderComponentResult = <V>(
  renderInfo: ComponentResult<V>,
  container: Node,
  trackerNode: Node,
  before: Node | null
): RenderResult<V> => {
  const result: RenderResult<V> = renderComponentResultNoSet(renderInfo, container, before);
  trackedNodes.set(trackerNode, result);
  return result;
}

const isReusableRenderResult = (componentResult: ComponentResult<any>, renderResult: RenderResult<any>) => {
  return renderResult.templateId === componentResult.template.id;
};

const checkAndRenderComponentResult = <V>(
  renderInfo: ComponentResult<V>,
  container: Node,
  trackerNode: Node,
  before: Node | null
) => {
  const oldResult = trackedNodes.get(trackerNode);
  if (oldResult) {
    if (isReusableRenderResult(renderInfo, oldResult)) {
      if (oldResult.set !== undefined) {
        oldResult.set(renderInfo.value, container, before);        
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

export const render = <V>(value: ComponentResult<V>, container: Node) => {
  return checkAndRenderComponentResult(value, container, container, null);
}

export type ItemTemplate<T> = (item: T, index: number) => unknown;

const removePart = <R>(markerIndex: number, oldResults: RepeatItemData<R>[], container: Node, before: Node | null) => {
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

type RepeatTemplateInput<V, R> = {
  values: Iterable<V>,
  mapFn: MapFn<V, ComponentResult<R>>,
  keyFn: KeyFn<V>,
};

type RepeatItemData<R> = {
  key: unknown,
  marker: Comment,
  result: RenderResult<R>,
}

type RepeatComponentData<R> = {
  key: unknown,
  result: ComponentResult<R>,
}

const repeatItemData = <R>(key: unknown, marker: Comment, result: RenderResult<R>): RepeatItemData<R> => ({
  key,
  marker,
  result,
});

const insertPartBefore = (
  newResults: RepeatComponentData<unknown>[],
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

const renderRepeatItem = <R>(
  oldResult: RepeatItemData<R>,
  newResult: RepeatComponentData<R>,
  container: Node,
  before: Node | null,
) => {
  if (isReusableRenderResult(newResult.result, oldResult.result)) {
    if (oldResult.result.set) {
      oldResult.result.set(newResult.result.value, container, before);
    }
    return oldResult;
  } else {
    const nodeAfterMarker = oldResult.marker.nextSibling;
    if (nodeAfterMarker !== null) {
      removeUntilBefore(container, nodeAfterMarker, before);
    }
    const renderResult = renderComponentResult(newResult.result, container, oldResult.marker, before);
    return repeatItemData(newResult.key, oldResult.marker, renderResult);
  }
}

const movePart = (
  oldResults: RepeatItemData<any>[],
  newResults: RepeatComponentData<any>[],
  oldIndex: number,
  newIndex: number,
  container: Node,
  oldNextMarker: Node | null,
  before: Node | null,
) => {
  const newResult = newResults[newIndex];

  const oldResult = oldResults[oldIndex];
  
  if (isReusableRenderResult(newResult.result, oldResult.result)) {
    const fragment = extractUntilBefore(
      oldResult.marker,
      oldNextMarker
    );
    if (oldResult.result.set) {
      oldResult.result.set(newResult.result.value, fragment, before);
    }
    container.insertBefore(fragment, before);
    return oldResult;
  } else {
    const nodeAfterMarker = oldResult.marker.nextSibling;
    if (nodeAfterMarker !== null) {
      removeUntilBefore(container, nodeAfterMarker, oldNextMarker);
    }
    container.insertBefore(oldResult.marker, before);
    const renderResult = renderComponentResult(newResult.result, container, oldResult.marker, before);
    return repeatItemData(newResult.key, oldResult.marker, renderResult);
  }
}

const repeatTemplate = createTemplate((initialInput: RepeatTemplateInput<any, any>, initialContainer, before) => {
  let oldResults: (RepeatItemData<any> | null)[] = [];
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

  return (newInput: RepeatTemplateInput<any, any>, container: Node) => {
    const newComponentResults: RepeatComponentData<any>[] = [];
    
    let i = 0;
    for(const itemValue of newInput.values) {
      const componentResult = figureOutComponentResult(newInput.mapFn(itemValue, i));
      if (componentResult !== null) {
        const key = newInput.keyFn(itemValue, i);
        newComponentResults.push({ key, result: componentResult });  
      }
      i++;
    }
    const newRenderResults: RepeatItemData<any>[] = new Array(newComponentResults.length);

    // Maps from key to index for current and previous update; these
    // are generated lazily only when needed as a performance
    // optimization, since they are only required for multiple
    // non-contiguous changes in the list, which are less common.
    let newKeyToIndexMap!: Map<unknown, number>;
    let oldKeyToIndexMap!: Map<unknown, number>;

    // Head and tail pointers to old parts and new values
    let oldHead = 0;
    let oldTail = oldResults.length - 1;
    let newHead = 0;
    let newTail = newComponentResults.length - 1;

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
        newRenderResults[newHead] = renderRepeatItem(oldResults[oldHead]!, newComponentResults[newHead], container, oldHead + 1 >= oldResults.length ? before : oldResults[oldHead + 1]!.marker);
        oldHead++;
        newHead++;
      } else if (oldResults[oldTail]!.key === newComponentResults[newTail].key) {
        // Old tail matches new tail; update in place
        newRenderResults[newTail] = renderRepeatItem(oldResults[oldTail]!, newComponentResults[newTail], container, oldTail + 1 >= oldResults.length ? before : oldResults[oldTail + 1]!.marker);
        oldTail--;
        newTail--;
      } else if (oldResults[oldHead]!.key === newComponentResults[newTail].key) {
        // Old head matches new tail; update and move to new tail
        newRenderResults[newTail] = movePart(
          oldResults as any,
          newComponentResults,
          oldHead,
          newTail,
          container,
          oldResults[oldHead + 1]!.marker,
          newTail + 1 < newRenderResults.length ? newRenderResults[newTail + 1].marker : before,
        );
        oldHead++;
        newTail--;
      } else if (oldResults[oldTail]!.key === newComponentResults[newHead].key) {
        // Old tail matches new head; update and move to new head
        newRenderResults[newHead] = movePart(
          oldResults as any,
          newComponentResults,
          oldTail,
          newHead,
          container,
          newTail + 1 < newRenderResults.length ? newRenderResults[newTail + 1]!.marker : before,
          oldResults[oldHead]!.marker,
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
          // Old head is no longer in new list; remove
          const oldNextMarker = oldHead + 1 < oldResults.length ? oldResults[oldHead + 1]!.marker : before;
          removePart(oldHead, oldResults as any, container, oldNextMarker);
          oldHead++;
        } else if (!newKeyToIndexMap.has(oldResults[oldTail]!.key)) {
          // Old tail is no longer in new list; remove
          removePart(oldTail, oldResults as any, container, newTail < newRenderResults.length ? newRenderResults[newTail].marker : before);
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
              container,
              oldHead < oldResults.length ? oldResults[oldHead]!.marker : before
            );
          } else {
            newRenderResults[newHead] = movePart(
              oldResults as any,
              newComponentResults,
              oldIndex,
              newHead,
              container,
              oldResults[oldIndex]!.marker,
              oldResults[oldHead]!.marker,
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
        container,
        newTail + 1 < newRenderResults.length ? newRenderResults[newTail + 1].marker : before
      );
      newHead++;
    }
    if (oldHead <= oldTail) {
      const firstToRemoveMarker = oldResults[oldHead]!.marker;
      const lastToRemoveMarker = newTail + 1 < newRenderResults.length ? newRenderResults[newTail + 1]!.marker : before;
      removeUntilBefore(container, firstToRemoveMarker, lastToRemoveMarker);
    }
    oldResults = newRenderResults;
  };
});

export const repeat = <V, CR extends ComponentResult<any>>(values: Iterable<V>, keyFn: KeyFn<V>, mapFn: MapFn<V, CR>): ComponentResult<RepeatTemplateInput<V, CR>> => {
  return {
    template: repeatTemplate,
    value: { values, keyFn, mapFn }
  };
}

export type SFC<P, R> = (props: P) => R;
export type StateSetter<S> = (state: S) => void;
export type StatefulComponent<P, S, R> = (props: P, statePatch: S, setState: StateSetter<S>) => R;
export const withState = <P, S extends {}, R>(sfcWithState: StatefulComponent<P, S, R>, initialState: S): SFC<P, ComponentResult<P>> => {
  const stateTemplate = createTemplate((initialProps: P, container, before) => {
    const state = Object.create(initialState);
    const setState = (statePatch) => {
      Object.assign(state, statePatch);
    };
    const initialComponentResult = figureOutComponentResult(sfcWithState(initialProps, state, setState));
    let previousRenderResult: RenderResult<P> | null = null;
    if (initialComponentResult !== null) {
      previousRenderResult = renderComponentResultNoSet(initialComponentResult, container, before);
    }
    return (props: P) => {
      const componentResult = figureOutComponentResult(sfcWithState(props, state, setState));
      if (componentResult) {
        if (previousRenderResult !== null && isReusableRenderResult(componentResult, previousRenderResult)) {
          if (previousRenderResult.set) {
            previousRenderResult.set(props, container, before);
          }
        } else {
          previousRenderResult = renderComponentResultNoSet(componentResult, container, before);
        }
      } else {
        previousRenderResult = null;
      }
    };
  });
  return (props: P) => ({
    template: stateTemplate,
    value: props
  });
};