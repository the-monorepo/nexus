let nextTemplateId = 0;
const generateTemplateUid = () => nextTemplateId++;

type CloneFn<V, R extends StatelessCloneInfo<any> | CloneInfo<any, any>> = (
  v: V,
  container: Node,
  before: Node | null,
) => R;
type Id = number | any;
interface StatelessCloneInfo<N extends Node> {
  firstNode: N;
  persistent: undefined;
}
interface CloneInfo<N extends Node, C> {
  firstNode: N;
  persistent: C;
}
interface StatelessComponentTemplate<V, N extends Node> {
  id: Id;
  clone: CloneFn<V, StatelessCloneInfo<N>>;
  set: undefined;
}
interface StatefulComponentTemplate<C, V, N extends Node> {
  id: Id;
  clone: CloneFn<V, CloneInfo<N, C>>;
  set: SetFn<C, V>;
}
type GenericTemplate<C, V, N extends Node = Node> =
  | StatelessComponentTemplate<V, N>
  | StatefulComponentTemplate<C, V, N>;
type ComponentTemplate<C, V, N extends Node> =
  | GenericTemplate<C, V, N>;

interface CreateTemplateFunction {
  <V, N extends Node>(
    clone: CloneFn<V, StatelessCloneInfo<N>>,
  ): StatelessComponentTemplate<V, N>;
  <V, C, N extends Node>(
    clone: CloneFn<V, CloneInfo<N, C>>,
    set: SetFn<C, V>,
  ): StatefulComponentTemplate<C, V, N>;
}

interface CloneInfoFunction {
  <N extends Node>(firstNode: N): StatelessCloneInfo<N>;
  <N extends Node, C>(firstNode: N, persistent: C): CloneInfo<N, C>;
}
const cloneInfo: CloneInfoFunction = <C, N extends Node | null>(
  firstNode: N,
  persistent?: C,
) => ({
  firstNode,
  persistent,
});

const createTemplate = ((clone, set) => ({
  id: generateTemplateUid(),
  clone,
  set,
})) as CreateTemplateFunction; // TODO: Try remove the as any at some point

const ATTRIBUTE_TYPE = 0;
const PROPERTY_TYPE = 1;
const EVENT_TYPE = 2;
const SPREAD_TYPE = 3;
const CHILD_TYPE = 4;
const DYNAMIC_SECTION_TYPE = 5;

interface AttributeField {
  type: typeof ATTRIBUTE_TYPE;
  el: Element;
  key: string;
  oldValue?: any;
}

export const attribute = <E extends Element = any>(
  el: E,
  key: string,
): AttributeField => {
  return {
    type: ATTRIBUTE_TYPE,
    el,
    key,
    oldValue: undefined,
  };
};

type PropertySetter = (node: Element, value: any) => any;
interface PropertyField {
  type: typeof PROPERTY_TYPE;
  el: Element;
  setter: PropertySetter;
  oldValue?: any;
}
export const property = <E extends Element = any>(
  el: E,
  setter: PropertySetter,
): PropertyField => {
  return {
    type: PROPERTY_TYPE,
    el,
    setter,
    oldValue: undefined,
  };
};

interface EventField {
  type: typeof EVENT_TYPE;
  el: Element;
  key: string;
  oldValue?: any;
}
export const event = <E extends Element = any>(el: E, key: string): EventField => {
  return {
    type: EVENT_TYPE,
    el,
    key,
    oldValue: undefined,
  };
};

type Field =
  | AttributeField
  | PropertyField
  | EventField
  | ChildrenField<unknown, unknown>
  | DynamicSectionField
  | SpreadField;
type ElementField = AttributeField | PropertyField | EventField | SpreadField;
type TextTemplateInput = string | boolean | number;
const textTemplate = createTemplate((value: TextTemplateInput, container, before) => {
  const node = document.createTextNode(value.toString());
  container.insertBefore(node, before);
  return cloneInfo(node, node);
}, (textNode, value) => {
  textNode.data = value.toString();
});
type TextTemplate = typeof textTemplate;

type MapItemData = RenderResult<any>;

interface MapTemplateState {
  oldResults: (MapItemData | null)[];
}

const renderResult = <C, N extends Node>(
  templateId: number,
  firstNode: N,
  persistent: C,
): RenderResult<C, N> => ({
  templateId,
  firstNode,
  persistent,
});

const setInitialFieldValues = (
  fields: ReadonlyArray<Field>,
  fieldValues: ReadonlyArray<unknown>,
) => {
  const fieldLength = fields.length;
  let v = 0;
  for(let f = 0; f < fieldLength; f++) {
    const field = fields[f];
    switch (field.type) {
      case EVENT_TYPE:
      case ATTRIBUTE_TYPE:
      case PROPERTY_TYPE:
      case SPREAD_TYPE: {
        const value = fieldValues[v++];
        setElementField(field, value);
        break;
      }
      case CHILD_TYPE: {
        const value = fieldValues[v++];
        field.oldValue = setDynamicSectionChild(value, field.oldValue, field.el, field.before);
        break;
      }
      case DYNAMIC_SECTION_TYPE: {
        v += field.oldValues.length;
        setDynamicSection(field, fieldValues, v);
        break;
      }
    }
  }
};

const renderComponentResultNoSet = (
  renderInfo: ComponentResult<any, any, any>,
  container: Node,
  before: Node | null,
): RenderResult<any> => {
  const template = renderInfo.template;
  const { persistent, firstNode } = template.clone(
    renderInfo.value,
    container,
    before,
  );
  return renderResult(template.id, firstNode, persistent);
};

export const componentResult = <C, V, N extends Node>(
  template: ComponentTemplate<C, V, N>,
  value: V,
): ComponentResult<C, V, N> => ({
  template,
  value,
});

const replaceOldResult = <C, V, N extends Node>(
  renderInfo: ComponentResult<C, V, N>,
  container: Node,
  oldResult: RenderResult<C, N>,
  before: Node | null,
) => {
  removeUntilBefore(container, oldResult.firstNode, before);
  return renderComponentResultNoSet(renderInfo, container, before);
}

const componentResultFromValue = (
  value: any,
): ComponentResult<unknown, any, Node> => {
  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return componentResult(textTemplate, value);
  } else if (value[Symbol.iterator] !== undefined) {
    return componentResult(mapTemplate, value);
  } else {
    return value;
  }
};

const trackedNodes = new WeakMap<Node, RenderResult<any>>();
export const render = (value: any, container: Node) => {
  if (value == null) {
    removeUntilBefore(container, container.firstChild, null);
    trackedNodes.delete(container);
  } else {
    const componentResult = componentResultFromValue(value);
    const oldResult = trackedNodes.get(container);
    if (oldResult === undefined) {
      trackedNodes.set(container, renderComponentResultNoSet(componentResult, container, null));
    } else if (isReusableRenderResult(componentResult, oldResult)) {
      if (componentResult.template.set !== undefined) {
        componentResult.template.set(oldResult.persistent, componentResult.value, container, null);
      }
    } else {
      trackedNodes.set(container, replaceOldResult(componentResult, container, oldResult, null));
    }
  }
};

const renderMapItemData = (
  oldResult: MapItemData,
  newValue: ComponentResult<any, any, any>,
  container: Node,
  before: Node | null,
) => {
  if (isReusableRenderResult(newValue, oldResult)) {
    if (newValue.template.set !== undefined) {
      newValue.template.set(oldResult.persistent, newValue.value, container, before);
    }
    return oldResult;
  } else {
    return replaceOldResult(newValue, container, oldResult, before);
  }
};

const mapTemplate: GenericTemplate<MapTemplateState, Iterable<any>> = createTemplate(
  (initialValues: Iterable<any>, container, before) => {
    let oldResults: MapItemData[] = [];
    let j = 0;
    const marker = document.createComment('');
    container.insertBefore(marker, before);
    for (const itemData of initialValues) {
      if (itemData != null) {
        const componentResult = componentResultFromValue(itemData);
        oldResults[j++] = renderComponentResultNoSet(componentResult, container, before);
      }
    }
    const state = { oldResults };
    return cloneInfo(marker, state);
  },
  (state: MapTemplateState, newInput: any[], container: Node, before: Node | null) => {
    const oldResults = state.oldResults;
    const newComponentResults: ComponentResult<any, any, any>[] = [];
    let j = 0;
    for (const itemValue of newInput) {
      if (itemValue != null) {
        const componentResult = componentResultFromValue(itemValue);
        newComponentResults[j++] = componentResult;
      }
    }

    const oldLength = oldResults.length;
    const newLength = newComponentResults.length;

    const newRenderResults: MapItemData[] = new Array(newLength);

    // Head and tail pointers to old parts and new values
    let oldHead = 0;
    let oldTail = oldLength - 1;

    let newHead = 0;
    let newTail = newLength - 1;

    while (oldHead <= oldTail && newHead <= newTail) {
      if (oldResults[oldHead] === null) {
        // `null` means old part at head has already been used
        // below; skip
        oldHead++;
      } else if (oldResults[oldTail] === null) {
        // `null` means old part at tail has already been used
        // below; skip
        oldTail--;
      } else if (
        oldResults[oldHead]!.templateId ===
        newComponentResults[newHead].template.id
      ) {
        // Old head matches new head; update in place
        newRenderResults[newHead] = renderMapItemData(
          oldResults[oldHead]!,
          newComponentResults[newHead],
          container,
          oldHead + 1 >= oldLength ? before : oldResults[oldHead + 1]!.firstNode,
        );
        oldHead++;
        newHead++;
      } else if (
        oldResults[oldTail]!.templateId ===
        newComponentResults[newTail].template.id
      ) {
        // Old tail matches new tail; update in place
        newRenderResults[newTail] = renderMapItemData(
          oldResults[oldTail]!,
          newComponentResults[newTail],
          container,
          oldTail + 1 >= oldLength ? before : oldResults[oldTail + 1]!.firstNode,
        );
        oldTail--;
        newTail--;
      } else if (
        oldResults[oldHead]!.templateId ===
        newComponentResults[newTail].template.id
      ) {
        // Old head matches new tail; update and move to new tail
        newRenderResults[newTail] = renderMapItemData(
          oldResults[oldHead]!,
          newComponentResults[newTail],
          container,
          newTail + 1 < newLength ? newRenderResults[newTail + 1].firstNode : before,
        );
        newTail--;
        oldHead++;
      } else if (
        oldResults[oldTail]!.templateId ===
        newComponentResults[newHead].template.id
      ) {
        // Old tail matches new head; update and move to new head
        newRenderResults[newTail] = renderMapItemData(
          oldResults[oldTail]!,
          newComponentResults[newHead],
          container,
          oldResults[oldHead]!.firstNode,
        );
        newHead++;
        oldTail++;
      } else {
        const oldNextMarker =
          oldHead + 1 < oldLength ? oldResults[oldHead + 1]!.firstNode : before;
        removeUntilBefore(container, oldResults[oldHead]!.firstNode, oldNextMarker);
        oldHead++;
      }
    }

    if (oldHead <= oldTail) {
      const firstToRemoveMarker = oldResults[oldHead]!.firstNode;
      const lastToRemoveMarker =
        newTail + 1 < newLength ? newRenderResults[newTail + 1]!.firstNode : before;
      removeUntilBefore(container, firstToRemoveMarker, lastToRemoveMarker);
    } else {
      // Add parts for any remaining new values
      const insertAdditionalPartsBefore =
        newTail + 1 < newLength ? newRenderResults[newTail + 1].firstNode : before;
      let i = newHead;
      while (i <= newTail) {
        const result = renderComponentResultNoSet(
          newComponentResults[i],
          container,
          insertAdditionalPartsBefore,
        );
        newRenderResults[i] = result;
        i++;
      }
    }
    state.oldResults = newRenderResults;
  },
);

interface DynamicSectionField {
  type: typeof DYNAMIC_SECTION_TYPE;
  el: Node;
  before: Node | null;
  oldValues: ReadonlyArray<({ firstNode: Node; result: RenderResult<any> | undefined })>;
}
export const dynamicSection = (
  el: Node,
  before: Node,
  length: number,
): DynamicSectionField => {
  return {
    type: DYNAMIC_SECTION_TYPE,
    el,
    before,
    oldValues: new Array(length).fill(null).map(() => ({
      firstNode: before,
      result: undefined,
    })),
  };
};

interface ChildrenField<C, V> {
  type: typeof CHILD_TYPE;
  el: Node;
  oldValue: RenderResult<C> | undefined;
  before: Node | null;
}
export const children = <C, V>(
  el: Node,
  before: Node | null,
): ChildrenField<C, V> => {
  return {
    type: CHILD_TYPE,
    el,
    before,
    oldValue: undefined,
  };
};
type FieldFactory = <E extends Node = any>(root: E) => ReadonlyArray<Field>;

export const staticFragmentTemplate = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement = template.content;
  return createTemplate((nothing, container, before) => {
    const cloned = document.importNode(rootElement, true);
    container.insertBefore(cloned, before);
    const firstNode = cloned.firstChild as Node;
    return cloneInfo(firstNode);
  });
};

export const staticElementTemplate = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement: Element = template.content.firstChild as Element;
  return createTemplate((nothing, container, before) => {
    const cloned = document.importNode(rootElement, true);
    container.insertBefore(cloned, before);
    return cloneInfo(cloned);
  });
};

const setDynamicSectionChild = (
  value: unknown,
  oldResult: RenderResult<unknown> | undefined,
  container: Node,
  before: Node | null,
): RenderResult<unknown> | undefined => {
  if (value == null) {
    if (oldResult !== undefined) {
      removeUntilBefore(container, oldResult.firstNode, before);
    }
    return undefined;    
  }
  const componentResult = componentResultFromValue(value);
  if (oldResult === undefined) {
    return renderComponentResultNoSet(componentResult, container, before);
  } else if (isReusableRenderResult(componentResult, oldResult)) {
    if (componentResult.template.set !== undefined) {
      componentResult.template.set(oldResult.persistent, componentResult.value, container, before);
    }
    return oldResult;
  } else {
    return replaceOldResult(componentResult, container, oldResult, before);
  }
};

const setDynamicSection = (field: DynamicSectionField, fieldValues: ReadonlyArray<any>, v: number) => {
  const container = field.el;
  const lastFieldIndex = field.oldValues.length - 1;
  let before = field.before;
  let f = lastFieldIndex;
  do {
    const fieldValue = fieldValues[v];
    const oldValue = field.oldValues[f];
    oldValue.result = setDynamicSectionChild(
      fieldValue,
      oldValue.result,
      container,
      before
    );
    if (oldValue.result !== undefined) {
      before = oldValue.result.firstNode;
    }
    v--;
    f--;
  } while(f >= 0)
};

const domFieldSetter = (fields: ReadonlyArray<Field>, fieldValues: ReadonlyArray<any>) => {
  const fieldLength = fields.length;
  let v = 0;
  for(let f = 0; f < fieldLength; f++) {
    const field = fields[f];
    switch (field.type) {
      case EVENT_TYPE:
      case ATTRIBUTE_TYPE:
      case PROPERTY_TYPE:
      case SPREAD_TYPE: {
        const value = fieldValues[v++];
        if (field.oldValue !== value) {
          setElementField(field, value);
        }
        break;
      }
      case CHILD_TYPE: {
        const value = fieldValues[v++];
        field.oldValue = setDynamicSectionChild(value, field.oldValue, field.el, field.before);
        break;
      }
      case DYNAMIC_SECTION_TYPE: {
        v += field.oldValues.length;
        setDynamicSection(field, fieldValues, v);
        break;
      }
    }
  }
};

export const elementTemplate = (
  html: string,
  fieldFactory: FieldFactory,
) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement = template.content.firstChild as Element;
  return createTemplate((fieldValues: ReadonlyArray<any>, container, before) => {
    const cloned = document.importNode(rootElement, true);
    container.insertBefore(cloned, before);
    const fields = fieldFactory(cloned);
    setInitialFieldValues(fields, fieldValues);
    return cloneInfo(cloned, fields);
  }, domFieldSetter)
};

export const fragmentTemplate = (
  html: string,
  fieldFactory: FieldFactory,
) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement = template.content;
  return createTemplate((fieldValues: ReadonlyArray<any>, container, before) => {
    const cloned = document.importNode(rootElement, true);
    const firstNode = cloned.firstChild as Node;
    container.insertBefore(cloned, before);
    const fields = fieldFactory(container);
    setInitialFieldValues(fields, fieldValues);
    return cloneInfo(firstNode, fields);
  }, domFieldSetter);
};

interface SpreadField {
  type: typeof SPREAD_TYPE;
  el: Element;
  oldValue: { [s: string]: any };
}
export const spread = (el: Element) => {
  return {
    type: SPREAD_TYPE,
    el,
    oldValue: {},
  };
};

interface ComponentResult<C, V, N extends Node> {
  template: ComponentTemplate<C, V, N>;
  value: V;
}

interface RenderResult<C, N extends Node = Node> {
  templateId: Id;
  firstNode: N;
  persistent: C;
}

const removeUntilBefore = (
  container: Node,
  startElement: Node | null,
  stopElement: Node | null,
) => {
  while (startElement !== stopElement) {
    const nextSibling = startElement!.nextSibling;
    container.removeChild(startElement!);
    startElement = nextSibling;
  }
};

const moveUntilBefore = (
  newContainer: Node,
  startElement: Node | null,
  stopElement: Node | null,
  before: Node | null,
) => {
  while (startElement !== stopElement) {
    const nextSibling = startElement!.nextSibling!;
    newContainer.insertBefore(startElement!, before);
    startElement = nextSibling;
  }
};

const setAttribute = (el: Element, key: string, value: any) => {
  if (value != null) {
    el.setAttribute(key, value);
  } else {
    el.removeAttribute(key);
  }
};

const removeEvent = (el: Element, key: string, eventObject) => {
  if (eventObject != null) {
    if (typeof eventObject === 'function') {
      el.removeEventListener(key, eventObject);
    } else {
      el.removeEventListener(key, eventObject.handle, eventObject.options);
    }
  }
};

const setEvent = (el: Element, key: string, oldValue, newValue) => {
  removeEvent(el, key, oldValue);
  if (newValue != null) {
    if (typeof newValue === 'function') {
      el.addEventListener(key, newValue);
    } else {
      el.addEventListener(key, newValue.handle, newValue.options);
    }
  }
};

const EVENT_PREFIX_REGEX = /^\$\$/;
const PROPERTY_PREFIX_REGEX = /^\$/;
const fieldInfo = (type: typeof EVENT_TYPE | typeof PROPERTY_TYPE | typeof ATTRIBUTE_TYPE, key: string) => ({
  type, key
})
const fieldInfoFromKey = (key: string) => {
  if (key.match(EVENT_PREFIX_REGEX)) {
    return fieldInfo(EVENT_TYPE, key.replace(EVENT_PREFIX_REGEX, ''));
  } else if (key.match(PROPERTY_PREFIX_REGEX)) {
    return fieldInfo(PROPERTY_TYPE, key.replace(PROPERTY_PREFIX_REGEX, ''));
  } else {
    return fieldInfo(ATTRIBUTE_TYPE, key);
  }
};

const applySpread = (el: Element, oldValue, newValue) => {
  const newKeys = new Set();
  for (const [prefixedKey, value] of Object.entries(newValue)) {
    newKeys.add(prefixedKey);
    if (oldValue[prefixedKey] !== value) {
      const { type, key } = fieldInfoFromKey(prefixedKey);
      switch (type) {
        case ATTRIBUTE_TYPE:
          setAttribute(el, key, value);
          break;
        case PROPERTY_TYPE:
          el[key] = value;
          break;
        case EVENT_TYPE:
          setEvent(el, key, oldValue, value);
          break;
      }
    }
  }
  for (const prefixedKey in oldValue) {
    if (newKeys.has(prefixedKey)) {
      continue;
    }
    const { type, key } = fieldInfoFromKey(prefixedKey);
    switch (type) {
      case ATTRIBUTE_TYPE:
        el.removeAttribute(key);
        break;
      case PROPERTY_TYPE:
        el[key] = undefined;
        break;
      case EVENT_TYPE:
        removeEvent(el, key, newValue);
        break;
    }
  }
};

const setElementField = (field: ElementField, newValue: any) => {
  switch (field.type) {
    case SPREAD_TYPE:
      if (newValue == null) {
        newValue = {};
      }
      applySpread(field.el, field.oldValue, newValue);
      break;
    case ATTRIBUTE_TYPE:
      setAttribute(field.el, field.key, newValue);
      break;
    case PROPERTY_TYPE:
      field.setter(field.el, newValue);
      break;
    case EVENT_TYPE:
      setEvent(field.el, field.key, field.oldValue, newValue);
      break;
  }
  field.oldValue = newValue;
};

export type KeyFn<T> = (item: T, index: number) => unknown;
export type MapFn<T, R> = (item: T, index: number) => R;
export type SetFn<C, V> = (
  cloneValue: C,
  value: V,
  container: Node,
  before: Node | null,
) => any;

const isReusableRenderResult = (
  componentResult: ComponentResult<any, any, any>,
  renderResult: RenderResult<any>,
) => {
  return renderResult.templateId === componentResult.template.id;
};

export type ItemTemplate<T> = (item: T, index: number) => unknown;

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

interface RepeatTemplateInput<V, C, R, N extends Node = Node> {
  values: Iterable<V>;
  mapFn: MapFn<V, ComponentResult<C, R, N>>;
  keyFn: KeyFn<V>;
  recycle: boolean;
}

const renderRepeatItem = <C, R, N extends Node>(
  oldResult: RenderResult<C, N>,
  newResult: ComponentResult<C, R, N>,
  container: Node,
  before: Node | null,
) => {
  if (isReusableRenderResult(newResult, oldResult)) {
    if (newResult.template.set !== undefined) {
      newResult.template.set(oldResult.persistent, newResult.value, container, before);
    }
    return oldResult;
  } else {
    removeUntilBefore(container, oldResult.firstNode, before);
    const renderResult = renderComponentResultNoSet(newResult, container, before);
    return renderResult;
  }
};

const movePart = (
  oldResult: RenderResult<any, any>,
  newResult: ComponentResult<any, any, any>,
  container: Node,
  oldNextMarker: Node | null,
  before: Node | null,
) => {

  if (isReusableRenderResult(newResult, oldResult)) {
    moveUntilBefore(container, oldResult.firstNode, oldNextMarker, before);
    if (newResult.template.set !== undefined) {
      newResult.template.set(oldResult.persistent, newResult.value, container, before);
    }
    return oldResult;
  } else {
    removeUntilBefore(container, oldResult.firstNode, oldNextMarker);
    const renderResult = renderComponentResultNoSet(newResult, container, before);
    return renderResult;
  }
};

const canReuseRemovedPart = (
  oldKeyToIndexMap: Map<any, any>,
  newComponentResults: ComponentResult<any, any, Node>[],
  newKeys: any[],
  oldResults: (RenderResult<any, any> | null)[],
  newIndex: number,
  oldIndex: number,
) => {
  return (
    !oldKeyToIndexMap.has(newKeys[newIndex]) &&
    isReusableRenderResult(
      newComponentResults[newIndex],
      oldResults[oldIndex]!,
    )
  );
};

interface RepeatTemplateCache<C, N extends Node> {
  oldResults: (RenderResult<C, N> | null)[];
  keys: any[];
}
const repeatTemplate = createTemplate(
  (initialInput: RepeatTemplateInput<any, any, any>, initialContainer, before) => {
    const oldResults: RenderResult<any, any>[] = [];
    const keys: any[] = [];

    let i = 0;
    let j = 0;
    const marker = document.createComment('');
    initialContainer.insertBefore(marker, before);
    for (const itemData of initialInput.values) {
      if(itemData != null) {
        const componentResult = componentResultFromValue(initialInput.mapFn(itemData, i));
        const key = initialInput.keyFn(itemData, i);
        const result = renderComponentResultNoSet(
          componentResult,
          initialContainer,
          before,
        );
        keys[j] = key;
        oldResults[j] = result;
        j++;
      }
      i++;
    }
    const state: RepeatTemplateCache<any, any> = { oldResults, keys };
    return cloneInfo(marker, state);
  },
  (
    state: RepeatTemplateCache<any, any>,
    newInput: RepeatTemplateInput<any, any, any, any>,
    container: Node,
    before: Node | null,
  ) => {
    const {oldResults, keys} = state;
    const newComponentResults: ComponentResult<any, any, Node>[] = [];
    const newKeys: any[] = [];
    let i = 0;
    let j = 0;
    for (const itemValue of newInput.values) {
      if (itemValue != null) {
        const componentResult = componentResultFromValue(newInput.mapFn(itemValue, i));
        const key = newInput.keyFn(itemValue, i);
        newKeys[j] = key;
        newComponentResults[j] = componentResult;
        j++;
      }
      i++;
    }

    const oldLength = oldResults.length;
    const newLength = newComponentResults.length;

    const newRenderResults: RenderResult<any, any>[] = new Array(newLength);

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

    while (oldHead <= oldTail && newHead <= newTail) {
      if (oldResults[oldHead] === null) {
        // `null` means old part at head has already been used
        // below; skip
        oldHead++;
      } else if (oldResults[oldTail] === null) {
        // `null` means old part at tail has already been used
        // below; skip
        oldTail--;
      } else if (keys[oldHead] === newKeys[newHead]) {
        const nextOldHead = oldHead + 1;
        // Old head matches new head; update in place
        newRenderResults[newHead] = renderRepeatItem(
          oldResults[oldHead]!,
          newComponentResults[newHead],
          container,
          nextOldHead >= oldLength ? before : oldResults[nextOldHead]!.firstNode,
        );
        oldHead = nextOldHead;
        newHead++;
      } else if (keys[oldTail] === newKeys[newTail]) {
        const nextOldTail = oldTail + 1;
        // Old tail matches new tail; update in place
        newRenderResults[newTail] = renderRepeatItem(
          oldResults[oldTail]!,
          newComponentResults[newTail],
          container,
          nextOldTail >= oldLength ? before : oldResults[nextOldTail]!.firstNode,
        );
        oldTail--;
        newTail--;
      } else if (keys[oldHead] === newKeys[newTail]) {
        // Old head matches new tail; update and move to new tail
        const nextOldHead = oldHead + 1;
        const nextNewTail = newTail + 1;
        newRenderResults[newTail] = movePart(
          oldResults[oldHead]!,
          newComponentResults[newTail],
          container,
          oldResults[nextOldHead]!.firstNode,
          nextNewTail < newLength ? newRenderResults[nextNewTail].firstNode : before,
        );
        oldHead = nextOldHead;
        newTail--;
      } else if (keys[oldTail] === newKeys[newHead]) {
        const nextNewTail = newTail + 1;
        // Old tail matches new head; update and move to new head
        newRenderResults[newHead] = movePart(
          oldResults[oldTail]!,
          newComponentResults[newHead],
          container,
          nextNewTail < newLength ? newRenderResults[nextNewTail]!.firstNode : before,
          oldResults[oldHead]!.firstNode,
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
        if (!newKeyToIndexMap.has(keys[oldHead])) {
          /**
           * At this point there's no key in the new list that matches the old head's key but there's still a
           * chance that the new head is a totally new item that happens to share the same template ID as the
           * old head. If so, we can save quite a lot of time by just reusing the old head's DOM render result
           * and updating with the new head's values. This has great performance benefits for when you're replacing
           * a batch of render results with an entirely new set that still happen to share the same key.
           *
           * TODO: Might be worth making this more general in the sense that we could technically reuse parts
           * that don't share the same key, from ANYWHERE within the list
           * (i.e. Not just matching oldHead with newHead and oldTail with newTail). Not sure if it's worth it
           * or if it's even very performant.
           */
          const nextOldHead = oldHead + 1;
          const oldNextMarker =
            nextOldHead < oldLength ? oldResults[nextOldHead]!.firstNode : before;
          if (
            canReuseRemovedPart(
              oldKeyToIndexMap,
              newComponentResults,
              newKeys,
              oldResults,
              newHead,
              oldHead
            )
          ) {
            // The new head and old head don't exist in each other's lists but they share the same template; reuse
            newRenderResults[newHead] = renderRepeatItem(
              oldResults[oldHead]!,
              newComponentResults[newHead],
              container,
              oldNextMarker,
            );
            newHead++;
          } else {
            // Old head is no longer in new list; remove
            removeUntilBefore(container, oldResults[oldHead]!.firstNode, oldNextMarker);
          }
          oldHead++;
        } else if (!newKeyToIndexMap.has(keys[oldTail])) {
          const oldNextMarker =
            newTail < newLength ? newRenderResults[newTail].firstNode : before;
          if (
            canReuseRemovedPart(
              oldKeyToIndexMap,
              newComponentResults,
              newKeys,
              oldResults,
              newTail,
              oldTail,
            )
          ) {
            // The new tail and old tail don't exist in each other's lists but they share the same template; reuse
            newRenderResults[newTail] = renderRepeatItem(
              oldResults[oldTail]!,
              newComponentResults[newTail],
              container,
              oldNextMarker,
            );
            newTail--;
          } else {
            // Old tail is no longer in new list; remove
            removeUntilBefore(container, oldResults[oldTail]!.firstNode, oldNextMarker);
          }
          oldTail--;
        } else {
          // Any mismatches at this point are due to additions or
          // moves; see if we have an old part we can reuse and move
          // into place
          const oldIndex = oldKeyToIndexMap.get(newKeys[newHead]);
          if (oldIndex === undefined) {
            newRenderResults[newHead] = renderComponentResultNoSet(
              newComponentResults[newHead],
              container,
              oldHead < oldLength ? oldResults[oldHead]!.firstNode : before,
            );
          } else {
            const nextOldIndex = oldIndex + 1;
            newRenderResults[newHead] = movePart(
              oldResults[oldIndex]!,
              newComponentResults[newHead],
              container,
              nextOldIndex < oldLength ? oldResults[nextOldIndex]!.firstNode : before,
              oldResults[oldHead]!.firstNode,
            );
            oldResults[oldIndex] = null;
          }
          newHead++;
        }
      }
    }

    const nextNewTail = newTail + 1;
    if (oldHead <= oldTail) {
      const firstToRemoveMarker = oldResults[oldHead]!.firstNode;
      const lastToRemoveMarker =
        nextNewTail < newLength ? newRenderResults[nextNewTail].firstNode : before;
      removeUntilBefore(container, firstToRemoveMarker, lastToRemoveMarker);
    } else {
      // Add parts for any remaining new values
      const insertAdditionalPartsBefore =
        nextNewTail < newLength ? newRenderResults[nextNewTail].firstNode : before;
      while (newHead <= newTail) {
        newRenderResults[newHead] = renderComponentResultNoSet(
          newComponentResults[newHead],
          container,
          insertAdditionalPartsBefore,
        );
        newHead++;
      }
    }
    state.oldResults = newRenderResults;
    state.keys = newKeys;
  },
);

const keyedComponents = <V, C, R, CR extends ComponentResult<C, R, any>>(
  values: Iterable<V>,
  keyFn: KeyFn<V>,
  mapFn: MapFn<V, CR>,
  recycle: boolean,
): ComponentResult<
  RepeatTemplateCache<C, any>,
  RepeatTemplateInput<V, C, R, any>,
  any
> => {
  return componentResult(repeatTemplate, { values, keyFn, mapFn, recycle });
};

export const map = <V, C, R, CR extends ComponentResult<C, R, any>>(
  values: Iterable<V>,
  keyFn: KeyFn<V>,
  mapFn: MapFn<V, CR>,
): ComponentResult<
  RepeatTemplateCache<C, any>,
  RepeatTemplateInput<V, C, R, any>,
  any
> => {
  return keyedComponents(values, keyFn, mapFn, true);
};

export const repeat = <V, C, R, CR extends ComponentResult<C, R, any>>(
  values: Iterable<V>,
  keyFn: KeyFn<V>,
  mapFn: MapFn<V, CR>,
): ComponentResult<
  RepeatTemplateCache<C, any>,
  RepeatTemplateInput<V, C, R, any>,
  any
> => {
  return keyedComponents(values, keyFn, mapFn, false);
};

export type SFC<P, R> = (props: P) => R;
/*
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
    const initialComponentResult = componentResultFromValue(sfcWithState(initialProps, state, setState));
    const previousRenderResult: RenderResult<C, P> | null = initialComponentResult !== null ? renderComponentResultNoSet(initialComponentResult, container, before) : null;
    const internalState: InternalState<S, C, R> =  { previousRenderResult, state, setState };
    return internalState;
  }, (internalState, props, container, before) => {
    const { previousRenderResult, state, setState } = internalState;
    const componentResult = componentResultFromValue(sfcWithState(props, state, setState));
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
    // TODO: Shouldn't be null
    return null;
  });
  return (props: P) => ({
    template: stateTemplate,
    value: props
  })
};*/
