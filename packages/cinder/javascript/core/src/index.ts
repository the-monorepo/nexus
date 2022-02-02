export type ID = number | any;
const generateBlueprintUid = (): ID => Symbol();

export type MountFn<V, R extends StatelessCloneInfo<any> | RenderData<any, any>> = (
  v: V,
  container: Node,
  before: Node | null,
) => R;
export type StatelessCloneInfo<N extends Node> = {
  first: N;
  state: undefined;
};
export type Unmount<C> = (cloneValue: C) => any;
export type UnmountHolder<C> = {
  unmount: Unmount<C>;
};
export type StatelessComponentBlueprint<
  V,
  N extends Node,
  D = Unmount<any> | undefined,
> = {
  id: ID;
  mount: MountFn<V, StatelessCloneInfo<N>>;
  update: undefined;
  unmount: D;
};
export type StatefulComponentBlueprint<
  C,
  V,
  N extends Node,
  D = Unmount<any> | undefined,
> = {
  id: ID;
  mount: MountFn<V, RenderData<C, N>>;
  update: SetFn<C, V>;
  unmount: D;
};
export type GenericBlueprint<C, V, N extends Node = Node, D = undefined | Unmount<C>> =
  | StatelessComponentBlueprint<V, N, D>
  | StatefulComponentBlueprint<C, V, N, D>;
export type ComponentBlueprint<
  C,
  V,
  N extends Node = Node,
  D = undefined | Unmount<C>,
> = GenericBlueprint<C, V, N, D>;

export type CreateBlueprintFunction = {
  <V, N extends Node>(
    clone: MountFn<V, StatelessCloneInfo<N>>,
  ): StatelessComponentBlueprint<V, N, undefined> & UnmountHolder<undefined>;
  <V, C, N extends Node>(
    clone: MountFn<V, RenderData<C, N>>,
    update: SetFn<C, V>,
  ): StatefulComponentBlueprint<C, V, N, undefined> & UnmountHolder<undefined>;
  <V, C, N extends Node>(
    clone: MountFn<V, RenderData<C, N>>,
    update: undefined,
    unmount: Unmount<C>,
  ): StatelessComponentBlueprint<V, N> & UnmountHolder<C>;
  <V, C, N extends Node>(
    clone: MountFn<V, RenderData<C, N>>,
    update: SetFn<C, V>,
    unmount: Unmount<C>,
  ): StatefulComponentBlueprint<C, V, N> & UnmountHolder<C>;
};

export type CloneInfoFunction = {
  <N extends Node>(first: N): StatelessCloneInfo<N>;
  <N extends Node, C>(first: N, state: C): RenderData<C, N>;
};
export const renderData: CloneInfoFunction = <C, N extends Node | null>(
  first: N,
  state?: C,
) => ({
  first,
  state,
});

export const createBlueprint: CreateBlueprintFunction = (mount, update?, unmount?) => ({
  id: generateBlueprintUid(),
  mount,
  update,
  unmount,
});

abstract class CachedField implements Field {
  protected state = null;
  protected abstract set(value);

  init(fieldValues, v) {
    const value = fieldValues[v++];
    this.set(value);
    this.state = value;
    return v;
  }

  update(fieldValues, v) {
    const value = fieldValues[v++];
    if (this.state !== value) {
      this.set(value);
      this.state = value;
    }
    return v;
  }
}

class AsyncIteratorField<T extends any> extends CachedField {
  constructor(private readonly innerField: Field) {
    super();
  }

  set(iterable: AsyncIterable<T>) {
    (async () => {
      try {
        const iterator = iterable[Symbol.asyncIterator]();

        {
          const firstVal = await iterator.next();
          if (firstVal.done) {
            return;
          }
          this.innerField.init([firstVal.value], 0);
        }

        let val = await iterator.next();
        while (!val.done) {
          this.innerField.update([val.value], 0);
          val = await iterator.next();
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }
}

export const asyncIterator = (innerField: Field) => {
  return new AsyncIteratorField(innerField);
};

const setAttribute = (el: Element, key: string, value: any) => {
  if (value !== undefined) {
    el.setAttribute(key, value);
  } else {
    el.removeAttribute(key);
  }
};

class AttributeField extends CachedField {
  constructor(private readonly el: Element, private readonly key: string) {
    super();
  }

  set(value) {
    setAttribute(this.el, this.key, value);
  }
}

export const attribute = (el: Element, key: string): AttributeField => {
  return new AttributeField(el, key);
};

export type PropertySetter = (node: Element, value: any) => any;
class PropertyField extends CachedField {
  constructor(private readonly el: Element, private readonly setter: PropertySetter) {
    super();
  }

  set(value) {
    this.setter(this.el, value);
  }
}
export const property = <E extends Element = any>(
  el: E,
  setter: PropertySetter,
): PropertyField => {
  return new PropertyField(el, setter);
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

const setEvent = (el: Element, key: string, state, newValue) => {
  removeEvent(el, key, state);
  if (newValue != null) {
    if (typeof newValue === 'function') {
      el.addEventListener(key, newValue);
    } else {
      el.addEventListener(key, newValue.handle, newValue.options);
    }
  }
};

class EventField extends CachedField {
  constructor(private readonly el: Element, private readonly key: string) {
    super();
  }
  set(value) {
    setEvent(this.el, this.key, this.state, value);
  }
}
export const event = <E extends Element = any>(el: E, key: string): EventField => {
  return new EventField(el, key);
};

export type Field = {
  init: (fieldValues: readonly any[], v: number) => number;
  update: (fieldValues: readonly any[], v: number) => number;
};
export type TextBlueprintInput = string;
const textBlueprint = createBlueprint(
  (value: TextBlueprintInput, container, before) => {
    const node = document.createTextNode(value);
    container.insertBefore(node, before);
    return renderData(node, { node, value });
  },
  (state, value) => {
    if (state.state.value !== value) {
      state.state.value = value;
      state.state.node.data = value;
    }
  },
);

export type MapBlueprintState<C, N extends Node = Node> = {
  results: (RenderResult<C, N> | null)[];
};

export const renderResult = <C, N extends Node>(
  id: number,
  data: RenderData<any, N>,
  unmount?: Unmount<C>,
): RenderResult<C, N> => ({
  id,
  data,
  unmount,
});

export const removeUntilBefore = (
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

export const renderComponentResultNoSet = <C, V, N extends Node>(
  renderInfo: ComponentResult<C, V, N>,
  container: Node,
  before: Node | null,
): RenderResult<C, N> => {
  const blueprint = renderInfo.blueprint;
  const data = blueprint.mount(renderInfo.value, container, before);
  return renderResult(blueprint.id, data, blueprint.unmount);
};

export const componentResult = <C, V, N extends Node>(
  blueprint: ComponentBlueprint<C, V, N>,
  value: V,
): ComponentResult<C, V, N> => ({
  blueprint,
  value,
});

export const replaceOldResult = <C, V, N extends Node>(
  renderInfo: ComponentResult<C, V, N>,
  container: Node,
  oldResult: RenderResult<C, N>,
  before: Node | null,
) => {
  if (oldResult.unmount !== undefined) {
    oldResult.unmount(oldResult.data.state);
  }
  removeUntilBefore(container, oldResult.data.first, before);
  return renderComponentResultNoSet(renderInfo, container, before);
};

const indexKeyer = (item, i) => i;
export const componentResultFromValue = (value) => {
  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return componentResult(textBlueprint, value as string | number | boolean);
  } else if (value[Symbol.iterator] !== undefined) {
    return map(value, indexKeyer, componentResultFromValue);
  } else {
    return value;
  }
};

const trackedNodes = new WeakMap<Node, RenderResult<any> | undefined>();
export const render = (value: unknown, container: Node) => {
  const renderResult = renderValue(value, trackedNodes.get(container), container, null);
  trackedNodes.set(container, renderResult);
};

export const updateComponentResultsArray = <C, V, N extends Node>(
  newComponentResults: ComponentResult<C, V, N>[],
  results: (RenderResult<C, N> | null)[],
  oldHead: number,
  newHead: number,
  oldLength: number,
  newLength: number,
  container: Node,
  before: Node | null,
): RenderResult<C, N>[] => {
  const newRenderResults: RenderResult<C, N>[] = new Array(newLength);

  // Head and tail pointers to old parts and new values
  let oldTail = oldLength - 1;
  let newTail = newLength - 1;

  while (oldHead <= oldTail && newHead <= newTail) {
    if (results[oldHead] === null) {
      // `null` means old part at head has already been used
      // below; skip
      oldHead++;
    } else if (results[oldTail] === null) {
      // `null` means old part at tail has already been used
      // below; skip
      oldTail--;
    } else if (results[oldHead]!.id === newComponentResults[newHead].blueprint.id) {
      // Old head matches new head; update in place
      newRenderResults[newHead] = renderOrReuseComponentResult(
        newComponentResults[newHead],
        results[oldHead]!,
        container,
        oldHead + 1 >= oldLength ? before : results[oldHead + 1]!.data.first,
      )!;
      oldHead++;
      newHead++;
    } else if (results[oldTail]!.id === newComponentResults[newTail].blueprint.id) {
      // Old tail matches new tail; update in place
      newRenderResults[newTail] = renderOrReuseComponentResult(
        newComponentResults[newTail],
        results[oldTail]!,
        container,
        oldTail + 1 >= oldLength ? before : results[oldTail + 1]!.data.first,
      )!;
      oldTail--;
      newTail--;
    } else if (results[oldHead]!.id === newComponentResults[newTail].blueprint.id) {
      // Old head matches new tail; update and move to new tail
      newRenderResults[newTail] = renderOrReuseComponentResult(
        newComponentResults[newTail],
        results[oldHead]!,
        container,
        newTail + 1 < newLength ? newRenderResults[newTail + 1].data.first : before,
      )!;
      newTail--;
      oldHead++;
    } else if (results[oldTail]!.id === newComponentResults[newHead].blueprint.id) {
      // Old tail matches new head; update and move to new head
      newRenderResults[newTail] = renderOrReuseComponentResult(
        newComponentResults[newHead],
        results[oldTail]!,
        container,
        results[oldHead]!.data.first,
      )!;
      newHead++;
      oldTail++;
    } else {
      const oldNextMarker =
        oldHead + 1 < oldLength ? results[oldHead + 1]!.data.first : before;
      removeUntilBefore(container, results[oldHead]!.data.first, oldNextMarker);
      oldHead++;
    }
  }

  if (oldHead <= oldTail) {
    const firstToRemoveMarker = results[oldHead]!.data.first;
    const lastToRemoveMarker =
      newTail + 1 < newLength ? newRenderResults[newTail + 1]!.data.first : before;
    removeUntilBefore(container, firstToRemoveMarker, lastToRemoveMarker);
  } else {
    // Add parts for any remaining new values
    const insertAdditionalPartsBefore =
      newTail + 1 < newLength ? newRenderResults[newTail + 1].data.first : before;
    let i = newHead;
    while (i <= newTail) {
      newRenderResults[i] = renderComponentResultNoSet(
        newComponentResults[i],
        container,
        insertAdditionalPartsBefore,
      );
      i++;
    }
  }
  return newRenderResults;
};

class DynamicSection implements Field {
  private readonly state: (RenderResult<unknown> | undefined)[];
  constructor(private readonly el: Node, private readonly before: Node, length: number) {
    this.state = new Array(length).fill(undefined);
  }

  unmount() {
    for (const result of this.state) {
      if (result !== undefined && result.unmount !== undefined) {
        result.unmount(result.data.state);
      }
    }
  }

  init(fieldValues, v) {
    return this.update(fieldValues, v);
  }

  update(fieldValues, v) {
    const container = this.el;
    let before = this.before;
    let f = 0;
    do {
      const fieldValue = fieldValues[v];
      const state = this.state[f];
      this.state[f] = renderValue(fieldValue, state, container, before);
      if (state !== undefined) {
        before = state.data.first;
      }
      v++;
      f++;
    } while (f < this.state.length);
    return v;
  }
}
export const dynamicSection = (el: Node, before: Node, length: number) => {
  return new DynamicSection(el, before, length);
};

class ChildrenField implements Field {
  private state: RenderResult<any, any> | undefined = undefined;
  constructor(private readonly el: Node, private readonly before: Node | null) {}

  init(fieldValues, v) {
    return this.update(fieldValues, v);
  }

  update(fieldValues, v) {
    const value = fieldValues[v++];
    this.state = renderValue(value, this.state, this.el, this.before);
    return v;
  }

  unmount() {
    if (this.state !== undefined && this.state.unmount !== undefined) {
      this.state.unmount(this.state.data.state);
    }
  }
}
export const children = (el: Node, before: Node | null): ChildrenField => {
  return new ChildrenField(el, before);
};
type FieldFactory = <E extends Node = any>(root: E) => readonly Field[];

export const staticFragmentBlueprint = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement = template.content;
  return createBlueprint((nothing, container, before) => {
    const cloned = document.importNode(rootElement, true);
    container.insertBefore(cloned, before);
    const first = cloned.firstChild as Node;
    return renderData(first);
  });
};

export const staticElementBlueprint = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement: Element = template.content.firstChild as Element;
  return createBlueprint((nothing, container, before) => {
    const cloned = document.importNode(rootElement, true);
    container.insertBefore(cloned, before);
    return renderData(cloned);
  });
};

export const renderOrReuseComponentResult = <C, V, N extends Node>(
  componentResult: ComponentResult<C, V, N>,
  oldResult: RenderResult<C, N> | undefined,
  container: Node,
  before: Node | null,
): RenderResult<C, N> => {
  if (oldResult === undefined) {
    return renderComponentResultNoSet(componentResult, container, before);
  } else if (isReusableRenderResult(componentResult, oldResult)) {
    if (componentResult.blueprint.update !== undefined) {
      componentResult.blueprint.update(
        oldResult.data,
        componentResult.value,
        container,
        before,
      );
    }
    return oldResult;
  } else {
    return replaceOldResult(componentResult, container, oldResult, before);
  }
};


type DynamicElementBlueprintProps<T> = {
  value: T;
  properties: any;
};

const createDynamicElementBlueprint = <T>(createElementCallback: (v: T) => Element, transformProperties: (v) => any[], getFields: (element: Element) => readonly Field[]) => {
  const mount = ({ value, properties }: DynamicElementBlueprintProps<T>, container, before) => {
    const element = createElementCallback(value);

    const fields = getFields(element);

    console.log({ properties });
    initialDomFieldSetter(fields, transformProperties(properties));
    container.insertBefore(element, before);
    return renderData(element, { fields, value });
  };

  const blueprint = createBlueprint(
    mount,
    (state, values, container, before) => {
      console.log({ values });
      if (state.state.value === values.value) {
        domFieldSetter(renderData(state.first, state.state.fields), transformProperties(values.properties));
      } else {
        domFieldUnmount(renderData(state.first, state.state.fields));
        state.first.remove();
        state.state = mount(values, container, before).state;
      }
    },
    (state) => {
      domFieldUnmount(state.fields);
    },
  );

  return blueprint;
}

const dynamicTagNameBlueprint = createDynamicElementBlueprint<string>((v) => document.createElement(v), (v) => [v], (element) => [spread(element)]);
const dynamicElementBlueprint = createDynamicElementBlueprint<{ new ()}>((v) => new v(), ({ children, ...other }) => [other, children], (element) => [spread(element), children(element, null)]);

export const validateComponent = (component, properties) => {
  if (typeof component === 'string') {
    return componentResult(dynamicTagNameBlueprint, { value: component, properties });
  } else if (component?.prototype instanceof HTMLElement) {
    return componentResult(dynamicElementBlueprint, { value: component, properties });
  } else if (typeof component === 'function') {
    const result = component(properties);
    if (result === undefined) {
      throw new Error(
        `The '${component.name}' component returned ${result} which is not a valid return value`,
      );
    }
    return result;
  } else {
    throw new Error(`${component} is an invalid component value`);
  }
};

export const renderValue = (
  value: unknown,
  oldResult: RenderResult<unknown> | undefined,
  container: Node,
  before: Node | null,
): RenderResult<unknown> | undefined => {
  if (value === null || value === undefined) {
    if (oldResult !== undefined) {
      removeUntilBefore(container, oldResult.data.first, before);
    }
    return undefined;
  }
  const componentResult = componentResultFromValue(value);
  return renderOrReuseComponentResult(componentResult, oldResult, container, before);
};

const initialDomFieldSetter = (fields: readonly Field[], fieldValues: readonly any[]) => {
  let v = 0;
  for (let f = 0; f < fields.length; f++) {
    v = fields[f].init(fieldValues, v);
  }
};

const domFieldSetter = (
  result: RenderData<readonly Field[]>,
  fieldValues: readonly any[],
) => {
  let v = 0;
  const fields = result.state;
  for (let f = 0; f < fields.length; f++) {
    v = fields[f].update(fieldValues, v);
  }
};

const domFieldUnmount = (fields) => {
  for (const field of fields) {
    if (field.unmount !== undefined) {
      field.unmount();
    }
  }
};

export const elementBlueprint = (html: string, fieldFactory: FieldFactory) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement = template.content.firstChild as Element;
  return createBlueprint(
    (fieldValues: readonly any[], container, before) => {
      const cloned = document.importNode(rootElement, true);
      const fields = fieldFactory(cloned);
      initialDomFieldSetter(fields, fieldValues);
      container.insertBefore(cloned, before);
      return renderData(cloned, fields);
    },
    domFieldSetter,
    domFieldUnmount,
  );
};

export const fragmentBlueprint = (html: string, fieldFactory: FieldFactory) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement = template.content;
  return createBlueprint(
    (fieldValues: readonly any[], container, before) => {
      const cloned = document.importNode(rootElement, true);
      const first = cloned.firstChild as Node;
      const fields = fieldFactory(cloned);
      initialDomFieldSetter(fields, fieldValues);
      container.insertBefore(cloned, before);
      return renderData(first, fields);
    },
    domFieldSetter,
    domFieldUnmount,
  );
};

class SpreadField implements Field {
  private readonly state: { [s: string]: any } = {};
  constructor(private readonly el: Element) {}

  init(fieldValues, v) {
    return this.update(fieldValues, v);
  }

  update(fieldValues, v) {
    const value = fieldValues[v++];
    applySpread(this.el, this.state, value);
    return v;
  }
}
export const spread = (el: Element) => {
  return new SpreadField(el);
};

export type ComponentResult<C, V, N extends Node = Node> = {
  blueprint: ComponentBlueprint<C, V, N>;
  value: V;
};

export type RenderData<C, N extends Node = Node> = {
  first: N;
  state: C;
};
export type RenderResult<C, N extends Node = Node> = {
  id: ID;
  unmount?: Unmount<C>;
  data: RenderData<C, N>;
};

export const moveUntilBefore = (
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

const EVENT_PREFIX_REGEX = /^\$\$/;
const PROPERTY_PREFIX_REGEX = /^\$/;
const EVENT_TYPE = 0;
const PROPERTY_TYPE = 1;
const ATTRIBUTE_TYPE = 2;
const fieldInfo = (
  type: typeof EVENT_TYPE | typeof PROPERTY_TYPE | typeof ATTRIBUTE_TYPE,
  key: string,
) => ({
  type,
  key,
});
const fieldInfoFromKey = (key: string) => {
  if (key.match(EVENT_PREFIX_REGEX)) {
    return fieldInfo(EVENT_TYPE, key.replace(EVENT_PREFIX_REGEX, ''));
  } else if (key.match(PROPERTY_PREFIX_REGEX)) {
    return fieldInfo(PROPERTY_TYPE, key.replace(PROPERTY_PREFIX_REGEX, ''));
  } else {
    return fieldInfo(ATTRIBUTE_TYPE, key);
  }
};

const applySpread = (el: Element, state, newValue) => {
  const newKeys = new Set();
  for (const [prefixedKey, value] of Object.entries(newValue ?? {})) {
    newKeys.add(prefixedKey);
    if (state[prefixedKey] !== value) {
      const { type, key } = fieldInfoFromKey(prefixedKey);
      switch (type) {
        case ATTRIBUTE_TYPE:
          setAttribute(el, key, value);
          break;
        case PROPERTY_TYPE:
          el[key] = value;
          break;
        case EVENT_TYPE:
          setEvent(el, key, state, value);
          break;
      }
    }
  }
  for (const prefixedKey in state) {
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

export type KeyFn<T> = (item: T, index: number) => unknown;
export type MapFn<T, R> = (item: T, index: number) => R;
export type SetFn<C, V> = (
  cloneValue: RenderData<C, Node>,
  value: V,
  container: Node,
  before: Node | null,
) => any;

const isReusableRenderResult = (
  componentResult: ComponentResult<any, any, any>,
  renderResult: RenderResult<any>,
) => {
  return renderResult.id === componentResult.blueprint.id;
};

export type ItemBlueprint<T> = (item: T, index: number) => unknown;

// Helper for generating a map of array item to its index over a subset
// of an array (used to lazily generate `newKeyToIndexMap` and
// `oldKeyToIndexMap`)
const generateMap = <T>(list: T[], start: number, end: number) => {
  const map: Map<T, number> = new Map();
  for (let i = start; i <= end; i++) {
    map.set(list[i], i);
  }
  return map;
};

type RepeatBlueprintInput<V, C, R, N extends Node = Node> = {
  values: Iterable<V>;
  mapFn: MapFn<V, ComponentResult<C, R, N>>;
  keyFn: KeyFn<V>;
  recycle: boolean;
};

const movePart = (
  oldResult: RenderResult<any, any>,
  newResult: ComponentResult<any, any, any>,
  container: Node,
  oldNextMarker: Node | null,
  before: Node | null,
) => {
  if (isReusableRenderResult(newResult, oldResult)) {
    moveUntilBefore(container, oldResult.data.first, oldNextMarker, before);
    if (newResult.blueprint.update !== undefined) {
      newResult.blueprint.update(
        oldResult.data.state,
        newResult.value,
        container,
        before,
      );
    }
    return oldResult;
  } else {
    return replaceOldResult(newResult, container, oldResult, before);
  }
};

const canReuseRemovedPart = (
  oldKeyToIndexMap: Map<any, any>,
  newComponentResults: ComponentResult<any, any, Node>[],
  newKeys: any[],
  results: (RenderResult<any, any> | null)[],
  newIndex: number,
  oldIndex: number,
) => {
  return (
    !oldKeyToIndexMap.has(newKeys[newIndex]) &&
    isReusableRenderResult(newComponentResults[newIndex], results[oldIndex]!)
  );
};

type RepeatBlueprintCache<C, N extends Node> = {
  results: (RenderResult<C, N> | null)[];
  keys: any[];
};
export const repeatBlueprint = createBlueprint(
  (initialInput: RepeatBlueprintInput<any, any, any>, initialContainer, before) => {
    const results: RenderResult<any, any>[] = [];
    const keys: any[] = [];

    let i = 0;
    let j = 0;
    const marker = document.createComment('');
    initialContainer.insertBefore(marker, before);
    for (const itemData of initialInput.values) {
      if (itemData != null) {
        const componentResult = componentResultFromValue(initialInput.mapFn(itemData, i));
        const key = initialInput.keyFn(itemData, i);
        const result = renderComponentResultNoSet(
          componentResult,
          initialContainer,
          before,
        );
        keys[j] = key;
        results[j] = result;
        j++;
      }
      i++;
    }
    const state: RepeatBlueprintCache<any, any> = { results, keys };
    return renderData(marker, state);
  },
  (
    state: RenderData<RepeatBlueprintCache<any, any>>,
    newInput: RepeatBlueprintInput<any, any, any, any>,
    container: Node,
    before: Node | null,
  ) => {
    const { results, keys } = state.state;
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

    const oldLength = results.length;
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
      if (results[oldHead] === null) {
        // `null` means old part at head has already been used
        // below; skip
        oldHead++;
      } else if (results[oldTail] === null) {
        // `null` means old part at tail has already been used
        // below; skip
        oldTail--;
      } else if (keys[oldHead] === newKeys[newHead]) {
        const nextOldHead = oldHead + 1;
        // Old head matches new head; update in place
        newRenderResults[newHead] = renderOrReuseComponentResult(
          newComponentResults[newHead],
          results[oldHead]!,
          container,
          nextOldHead >= oldLength ? before : results[nextOldHead]!.data.first,
        )!;
        oldHead = nextOldHead;
        newHead++;
      } else if (keys[oldTail] === newKeys[newTail]) {
        const nextOldTail = oldTail + 1;
        // Old tail matches new tail; update in place
        newRenderResults[newTail] = renderOrReuseComponentResult(
          newComponentResults[newTail],
          results[oldTail]!,
          container,
          nextOldTail >= oldLength ? before : results[nextOldTail]!.data.first,
        )!;
        oldTail--;
        newTail--;
      } else if (keys[oldHead] === newKeys[newTail]) {
        // Old head matches new tail; update and move to new tail
        const nextOldHead = oldHead + 1;
        const nextNewTail = newTail + 1;
        newRenderResults[newTail] = movePart(
          results[oldHead]!,
          newComponentResults[newTail],
          container,
          results[nextOldHead]!.data.first,
          nextNewTail < newLength ? newRenderResults[nextNewTail].data.first : before,
        );
        oldHead = nextOldHead;
        newTail--;
      } else if (keys[oldTail] === newKeys[newHead]) {
        const nextNewTail = newTail + 1;
        // Old tail matches new head; update and move to new head
        newRenderResults[newHead] = movePart(
          results[oldTail]!,
          newComponentResults[newHead],
          container,
          nextNewTail < newLength ? newRenderResults[nextNewTail]!.data.first : before,
          results[oldHead]!.data.first,
        );
        oldTail--;
        newHead++;
      } else {
        if (newKeyToIndexMap === undefined) {
          // Lazily generate key-to-index maps, used for removals &
          // moves below
          newKeyToIndexMap = generateMap(newComponentResults, newHead, newTail);
          oldKeyToIndexMap = generateMap(results, oldHead, oldTail);
        }
        if (!newKeyToIndexMap.has(keys[oldHead])) {
          /**
           * At this point there's no key in the new list that matches the old head's key but there's still a
           * chance that the new head is a totally new item that happens to share the same blueprint ID as the
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
            nextOldHead < oldLength ? results[nextOldHead]!.data.first : before;
          if (
            canReuseRemovedPart(
              oldKeyToIndexMap,
              newComponentResults,
              newKeys,
              results,
              newHead,
              oldHead,
            )
          ) {
            // The new head and old head don't exist in each other's lists but they share the same blueprint; reuse
            newRenderResults[newHead] = renderOrReuseComponentResult(
              newComponentResults[newHead],
              results[oldHead]!,
              container,
              oldNextMarker,
            )!;
            newHead++;
          } else {
            // Old head is no longer in new list; remove
            removeUntilBefore(container, results[oldHead]!.data.first, oldNextMarker);
          }
          oldHead++;
        } else if (!newKeyToIndexMap.has(keys[oldTail])) {
          const oldNextMarker =
            newTail < newLength ? newRenderResults[newTail].data.first : before;
          if (
            canReuseRemovedPart(
              oldKeyToIndexMap,
              newComponentResults,
              newKeys,
              results,
              newTail,
              oldTail,
            )
          ) {
            // The new tail and old tail don't exist in each other's lists but they share the same blueprint; reuse
            newRenderResults[newTail] = renderOrReuseComponentResult(
              newComponentResults[newTail],
              results[oldTail]!,
              container,
              oldNextMarker,
            )!;
            newTail--;
          } else {
            // Old tail is no longer in new list; remove
            removeUntilBefore(container, results[oldTail]!.data.first, oldNextMarker);
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
              oldHead < oldLength ? results[oldHead]!.data.first : before,
            );
          } else {
            const nextOldIndex = oldIndex + 1;
            newRenderResults[newHead] = movePart(
              results[oldIndex]!,
              newComponentResults[newHead],
              container,
              nextOldIndex < oldLength ? results[nextOldIndex]!.data.first : before,
              results[oldHead]!.data.first,
            );
            results[oldIndex] = null;
          }
          newHead++;
        }
      }
    }

    const nextNewTail = newTail + 1;
    if (oldHead <= oldTail) {
      const firstToRemoveMarker = results[oldHead]!.data.first;
      const lastToRemoveMarker =
        nextNewTail < newLength ? newRenderResults[nextNewTail].data.first : before;
      removeUntilBefore(container, firstToRemoveMarker, lastToRemoveMarker);
    } else {
      // Add parts for any remaining new values
      const insertAdditionalPartsBefore =
        nextNewTail < newLength ? newRenderResults[nextNewTail].data.first : before;
      while (newHead <= newTail) {
        newRenderResults[newHead] = renderComponentResultNoSet(
          newComponentResults[newHead],
          container,
          insertAdditionalPartsBefore,
        );
        newHead++;
      }
    }
    state.state.results = newRenderResults;
    state.state.keys = newKeys;
  },
);

const keyedComponents = <V, C, R, CR extends ComponentResult<C, R, any>>(
  values: Iterable<V>,
  keyFn: KeyFn<V>,
  mapFn: MapFn<V, CR>,
  recycle: boolean,
) => {
  return componentResult(repeatBlueprint, { values, keyFn, mapFn, recycle });
};

export const map = <V, C, R, CR extends ComponentResult<C, R, any>>(
  values: Iterable<V>,
  keyFn: KeyFn<V>,
  mapFn: MapFn<V, CR>,
) => {
  return keyedComponents<V, C, R, CR>(values, keyFn, mapFn, true);
};

export const repeat = <V, C, R, CR extends ComponentResult<C, R, any>>(
  values: Iterable<V>,
  keyFn: KeyFn<V>,
  mapFn: MapFn<V, CR>,
) => {
  return keyedComponents<V, C, R, CR>(values, keyFn, mapFn, false);
};

// TODO Give R an extends
export type SFC<P, R = unknown> = (props: P) => R;

export type FC<P, R = unknown> = (props: P) => R;
