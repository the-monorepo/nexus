const STATIC_ELEMENT_TEMPLATE_ID = 0;
const ELEMENT_TEMPLATE_ID = 1;
const STATIC_FRAGMENT_TEMPLATE_ID = 2;
const FRAGMENT_TEMPLATE_ID = 3;
const TEXT_TEMPLATE_ID = 4;
let nextTemplateId = 5;
const generateTemplateUid = () => nextTemplateId++;

type CloneFn<V, R extends StatelessCloneInfo<any> | CloneInfo<any, any>> = (v: V, container: Node, before: Node | null) => R;
type Id = number | any;
type StatelessCloneInfo<N extends Node | null> = {
  firstNode: N,
  persistent: undefined
};
type CloneInfo<N extends Node | null, C> = {
  firstNode: N,
  persistent: C,
};
type StatelessComponentTemplate<V, N extends Node | null> = {
  id: Id,
  clone: CloneFn<V, StatelessCloneInfo<N>>,
  set: undefined,
};
type StatefulComponentTemplate<C, V, N extends Node | null> = {
  id: Id,
  clone: CloneFn<V, CloneInfo<N, C>>,
  set: SetFn<C, V>,
}
type GenericTemplate<C, V, N extends Node | null> = StatelessComponentTemplate<V, N> | StatefulComponentTemplate<C, V, N>;
type ComponentTemplate<C, V, N extends Node | null> = GenericTemplate<C, V, N> | TextTemplate | FragmentTemplate | ElementTemplate | StaticElementTemplate | StaticFragmentTemplate;

type CreateTemplateFunction = {
  <V, N extends Node | null>(clone: CloneFn<V, StatelessCloneInfo<N>>): StatelessComponentTemplate<V, N>,
  <V, C, N extends Node | null>(clone: CloneFn<V, CloneInfo<N, C>>, set: SetFn<C, V>): StatefulComponentTemplate<C, V, N>,
}
const createTemplate = ((
  clone,
  set,
) => ({
  id: generateTemplateUid(),
  clone,
  set
})) as CreateTemplateFunction; // TODO: Try remove the as any at some point

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
const DYNAMIC_SECTION_TYPE = 4;

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

type Field = AttributeField | PropertyField | EventField | ChildrenField<unknown, unknown> | DynamicSectionField;
type ElementField = AttributeField | PropertyField | EventField;
type TextTemplateInput = string | boolean | number | any;
const textTemplate = {
  id: TEXT_TEMPLATE_ID
}
type TextTemplate = typeof textTemplate;
/* createTemplate(
  (initialValue: TextTemplateInput, container: Node, before: Node | null) => {
    return cloneInfo(textNode, textNode);
  }, (textNode, value) => {
    textNode.textContent = value.toString();
  }
);*/

// TODO
const mapTemplate: any = null;

const figureOutComponentResult = (
  value: any,
): typeof value extends null | undefined ? null : ComponentResult<any, typeof value, any> => {
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

type DynamicSectionField = {
  type: typeof DYNAMIC_SECTION_TYPE,
  container: Node,
  before: Node | null;
  oldValues: ({ firstNode: Node | null, result: RenderResult<any, any> | undefined})[]
}
export const dynamicSection = (container: Node, before: Node | null, length: number): DynamicSectionField => {
  return {
    type: DYNAMIC_SECTION_TYPE,
    container,
    before,
    oldValues: new Array(length).fill(null).map(() => ({
      firstNode: before,
      result: undefined
    }))
  }
}

type ChildrenField<C, V> = {
  type: typeof CHILD_TYPE,
  container: Node,
  oldValue: RenderResult<C, any> | undefined,
  before: Node | null,
};
export const children = <C, V>(container: Node, before: Node | null): ChildrenField<C, V> => {
  return {
    type: CHILD_TYPE,
    container,
    before,
    oldValue: undefined,
  }
}
type FieldFactory = <E extends Node = any>(root: E) => ReadonlyArray<Field>;

type CloneInfoFunction = {
  <N extends Node | null>(firstNode: N): StatelessCloneInfo<N>,
  <N extends Node | null, C>(firstNode: N, persistent: C): CloneInfo<N, C>
}
const cloneInfo: CloneInfoFunction = <C, N extends Node | null>(firstNode: N, persistent?: C) => ({
  firstNode,
  persistent
});

export const staticFragmentTemplate = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement = template.content;
  return {
    id: STATIC_FRAGMENT_TEMPLATE_ID,
    rootElement,
  }
}
type StaticFragmentTemplate = ReturnType<typeof staticFragmentTemplate>;

export const staticElementTemplate = (
  html: string
) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement: Node = template.content.firstChild as Node;
  return {
    id: STATIC_ELEMENT_TEMPLATE_ID,
    rootElement,
  };
}
type StaticElementTemplate = ReturnType<typeof staticElementTemplate>;

const setDynamicSectionChild = (value: any, oldResult: RenderResult<any, any> | undefined, container: Node, before: Node | null): RenderResult<any, any> | undefined => {
  const componentResult = figureOutComponentResult(value);
  if (componentResult !== null) {
    return internalRender(componentResult, container, oldResult, before);
  } else {
    return undefined;
  }
}

const setDynamicSection = (field: DynamicSectionField, valueIterator: Iterator<any>) => {
  const container = field.container;
  {
    const oldValueIterator = field.oldValues[Symbol.iterator]();
    let previousOldValue = oldValueIterator.next();
    let oldValue = oldValueIterator.next();
    while(!oldValue.done) {
      previousOldValue.value.result = setDynamicSectionChild(
        valueIterator.next().value,
        previousOldValue.value.result,
        container,
        oldValue.value.firstNode
      )
      previousOldValue = oldValue;
      oldValue = oldValueIterator.next();
    }  
    previousOldValue.value.result = setDynamicSectionChild(
      valueIterator.next().value,
      previousOldValue.value.result,
      container,
      field.before
    )  
  }
  {
    const fieldLength = field.oldValues.length;
    const oldValues = field.oldValues;
    const lastIndex = fieldLength - 1;  
    let previousFirstNode = field.before;
    let i = lastIndex;
    // Always going to be 1 <= so we can use a do
    do {
      const oldValue = oldValues[i];
      if (oldValue.result !== undefined && oldValue.result.firstNode !== null) {
        previousFirstNode = oldValue.result.firstNode;
      }
      oldValue.firstNode = previousFirstNode;
    } while (--i >= 0)  
  }
}

const setInitialFieldValues = (initialValues: ReadonlyArray<any>, fields: ReadonlyArray<Field>) => {
  const fieldIterator = fields[Symbol.iterator]();
  const valueIterator = initialValues[Symbol.iterator]();

  let fieldItem = fieldIterator.next();
  do {
    const field = fieldItem.value;
    switch(field.type) {
      case CHILD_TYPE:
        setChildrenField(field, valueIterator.next().value, field.before);
        break;
      case DYNAMIC_SECTION_TYPE:
        setDynamicSection(field, valueIterator);
        break;
      default:
        setElementField(field, valueIterator.next().value);
        break;
    }
  } while (!(fieldItem = fieldIterator.next()).done);
}

const domFieldSetter = (fields, fieldValues) => {
  const fieldIterator = fields[Symbol.iterator]();
  const valueIterator = fieldValues[Symbol.iterator]();

  let fieldItem = fieldIterator.next();
  do {
    const field = fieldItem.value;
    switch(field.type) {
      case CHILD_TYPE:
        setChildrenField(field, valueIterator.next().value, field.before);
        break;
      case DYNAMIC_SECTION_TYPE:
        setDynamicSection(field, valueIterator);
        break;
      default:
        const value = valueIterator.next().value;
        if (field.oldValue !== value) {
          setElementField(field, value);
        }
        break;
    }
  } while (!(fieldItem = fieldIterator.next()).done);
}

type ElementTemplateState = ReadonlyArray<Field>;
export const elementTemplate = (
  html: string,
  fieldFactory: FieldFactory
) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement: Element = template.content.firstChild as Element;
  return {
    id: ELEMENT_TEMPLATE_ID,
    rootElement,
    fieldFactory
  }
}
type ElementTemplate = ReturnType<typeof elementTemplate>;

export const fragmentTemplate = (
  html: string,
  fieldFactory: FieldFactory
) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement: Node = template.content;
  return {
    id: FRAGMENT_TEMPLATE_ID,
    rootElement,
    fieldFactory
  }
}
type FragmentTemplate = ReturnType<typeof fragmentTemplate>;

export const spread = (el: Element) => {
  throw new Error('Not implemented yet');
}

type ComponentResult<C, V, N extends Node | null> = {
  template: ComponentTemplate<C, V, N>,
  value: V,
};


export const componentResult = <C, V, N extends Node | null>(template: ComponentTemplate<C, V, N>, value: V): ComponentResult<C, V, N> => ({
  template,
  value
});


type RenderResult<C, N extends Node | null> = {
  templateId: Id,
  firstNode: N,
  persistent: C,
};

const removeUntilBefore = (container: Node, startElement: Node | null, stopElement: Node | null) => {
  while(startElement !== stopElement) {
    const nextSibling = startElement!.nextSibling;
    container.removeChild(startElement!);
    startElement = nextSibling;
  }
}

const moveUntilBefore = (newContainer: Node, startElement: Node | null, stopElement: Node | null, before: Node | null) => {
  while(startElement !== stopElement) {
    const nextSibling = startElement!.nextSibling!;
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

const setChildrenField = (field: ChildrenField<unknown, unknown>, newValue: any, before: Node | null) => {
  const componentResult = figureOutComponentResult(newValue);
  if (componentResult !== null) {
    field.oldValue = internalRender(componentResult, field.container, field.oldValue, before);
  } else if(field.oldValue !== undefined) {
    removeRenderResult(field.container, field.oldValue, before);
    field.oldValue = undefined;
  }
}

export type KeyFn<T> = (item: T, index: number) => unknown;
export type MapFn<T, R> = (item: T, index: number) => R;
export type SetFn<C, V> = (cloneValue: C, value: V, container: Node, before: Node | null) => any;

const trackedNodes = new WeakMap<Node, RenderResult<any, any>>();

const renderComponentResultNoSet = <V>(
  renderInfo: ComponentResult<any, V, any>,
  container: Node,
  before: Node | null
): RenderResult<any, any> => {
  switch(renderInfo.template.id) {
    case TEXT_TEMPLATE_ID: {
      const node = document.createTextNode(renderInfo.value as any);
      container.insertBefore(node, before);
      return {
        templateId: TEXT_TEMPLATE_ID,
        persistent: renderInfo.value,
        firstNode: node
      };
    }
    case STATIC_ELEMENT_TEMPLATE_ID: {
      const template = renderInfo.template as StaticElementTemplate;
      const cloned = document.importNode(template.rootElement, true);
      container.insertBefore(cloned, before);
      return {
        templateId: STATIC_ELEMENT_TEMPLATE_ID,
        persistent: undefined,
        firstNode: cloned
      };
    }
    case STATIC_FRAGMENT_TEMPLATE_ID: {
      const template = renderInfo.template as StaticFragmentTemplate;
      const cloned = document.importNode(template.rootElement, true);
      container.insertBefore(cloned, before);
      const firstNode = cloned.firstChild;
      return {
        templateId: STATIC_FRAGMENT_TEMPLATE_ID,
        persistent: undefined,
        firstNode: firstNode === null ? before: firstNode
      };
    }
    case ELEMENT_TEMPLATE_ID: {
      const elementTemplate = renderInfo.template as ElementTemplate;
      const cloned = document.importNode(elementTemplate.rootElement, true);
      container.insertBefore(cloned, before);
      const fields = elementTemplate.fieldFactory(cloned);
      setInitialFieldValues(renderInfo.value as any, fields);
      return {
        templateId: ELEMENT_TEMPLATE_ID,
        persistent: fields,
        firstNode: cloned
      };
    }
    case FRAGMENT_TEMPLATE_ID: {
      const fragmentTemplate = renderInfo.template as FragmentTemplate;
      const cloned = document.importNode(fragmentTemplate.rootElement, true);
      const firstNode = cloned.firstChild;
      container.insertBefore(cloned, before);
      const fields = fragmentTemplate.fieldFactory(container);
      setInitialFieldValues(renderInfo.value as any, fields);
      return {
        templateId: FRAGMENT_TEMPLATE_ID,
        persistent: fields,
        firstNode: firstNode === null ? before : firstNode,
      }
    }
    default: {
      const template = renderInfo.template as GenericTemplate<any, V, any>;
      const { persistent, firstNode } = template.clone(renderInfo.value, container, before);
      return {
        templateId: template.id,
        // TODO: remove any
        persistent,
        firstNode
      };
    }
  }
}

const isReusableRenderResult = (componentResult: ComponentResult<any, any, any>, renderResult: RenderResult<any, any>) => {
  return renderResult.templateId === componentResult.template.id;
};

const removeRenderResult = (container: Node, result: RenderResult<any, any>, before: Node | null) => {
  if (result.firstNode !== null) {
    removeUntilBefore(container, result.firstNode, before);
  }
}

const setComponentResult = <C, V, N extends Node | null>(
  renderInfo: ComponentResult<C, V, N>,
  oldResult: RenderResult<C, N>,
  container: Node, 
  before: Node | null
) => {
  switch(renderInfo.template.id) {
    case TEXT_TEMPLATE_ID:
      if ((oldResult.persistent as any) !== renderInfo.value) {
        oldResult.firstNode!.textContent = renderInfo.value.toString();
        (oldResult.persistent as any) = renderInfo.value;
      }
      break;
    case ELEMENT_TEMPLATE_ID:
    case FRAGMENT_TEMPLATE_ID:
      domFieldSetter(oldResult.persistent, renderInfo.value);
      break;
    case STATIC_ELEMENT_TEMPLATE_ID:
    case STATIC_FRAGMENT_TEMPLATE_ID:
      break;
    default:
      const template = renderInfo.template as GenericTemplate<C, V, N>;
      if (template.set !== undefined) {
        template.set(oldResult.persistent, renderInfo.value, container, before);
      }      
      break;
  }
}

const internalRender = <C, V, N extends Node | null>(renderInfo: ComponentResult<C, V, N>, container: Node, oldResult: RenderResult<C, N> | undefined, before: Node | null) => {
  if (oldResult !== undefined) {
    if (isReusableRenderResult(renderInfo, oldResult)) {
      setComponentResult(renderInfo, oldResult, container, before);
      return oldResult;
    } else {
      removeRenderResult(container, oldResult, before);        
      return renderComponentResultNoSet(renderInfo, container, before);
    }
  } else {
    return renderComponentResultNoSet(renderInfo, container, before);
  }
}

export const render = (value: any, container: Node) => {
  const componentResult = figureOutComponentResult(value);
  if (componentResult) {
    const oldResult = trackedNodes.get(container);
    trackedNodes.set(container, internalRender(componentResult, container, oldResult, null));
  } else {
    trackedNodes.delete(container);
  }
}

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

type RepeatTemplateInput<V, C, R, N extends Node | null> = {
  values: Iterable<V>,
  mapFn: MapFn<V, ComponentResult<C, R, N>>,
  keyFn: KeyFn<V>,
};

type RepeatItemData<C, R, N extends Node | null> = {
  key: unknown,
  firstNode: Node | null,
  result: RenderResult<C, N>,
}

type RepeatComponentData<C, R, N extends Node | null> = {
  key: unknown,
  result: ComponentResult<C, R, N>,
}

const repeatItemData = <C, R, N extends Node | null>(key: unknown,result: RenderResult<C, N>, before: Node | null): RepeatItemData<C, R, N> => ({
  key,
  firstNode: result.firstNode || before,
  result,
});

const insertPartBefore = (
  newResults: RepeatComponentData<unknown, unknown, any>[],
  insertionIndex: number,
  container: Node,
  before: Node | null
) => {
  const newResult = newResults[insertionIndex];
  const renderResult = renderComponentResultNoSet(newResult.result, container, before);
  // No old part for this value; create a new one and
  // insert it
  return repeatItemData(newResult.key, renderResult, before);
};

const renderRepeatItem = <C, R, N extends Node | null>(
  oldResult: RepeatItemData<C, R, N>,
  newResult: RepeatComponentData<C, R, N>,
  container: Node,
  before: Node | null,
) => {
  if (isReusableRenderResult(newResult.result, oldResult.result)) {
    setComponentResult(newResult.result, oldResult.result, container, before);
    return oldResult;
  } else {
    removeRenderResult(container, oldResult.result, before);
    const renderResult = renderComponentResultNoSet(newResult.result, container, before);
    return repeatItemData(newResult.key, renderResult, before);
  }
}

const movePart = (
  oldResults: RepeatItemData<any, any, any>[],
  newResults: RepeatComponentData<any, any, any>[],
  oldIndex: number,
  newIndex: number,
  container: Node,
  oldNextMarker: Node | null,
  before: Node | null,
) => {
  const newResult = newResults[newIndex];

  const oldResult = oldResults[oldIndex];
  
  if (isReusableRenderResult(newResult.result, oldResult.result)) {
    moveUntilBefore(
      container,
      oldResult.firstNode,
      oldNextMarker,
      before
    );
    setComponentResult(newResult.result, oldResult.result, container, before);
    return oldResult;
  } else {
    removeRenderResult(container, oldResult.result, oldNextMarker);
    const renderResult = renderComponentResultNoSet(newResult.result, container, before);
    return repeatItemData(newResult.key, renderResult, before);
  }
}

const canReuseRemovedPart = (
  oldKeyToIndexMap: Map<any, any>,
  newComponentResults: RepeatComponentData<any, any, any>[],
  oldResults: (RepeatItemData<any, any, any> | null)[],
  newIndex: number,
  oldIndex: number
) =>{
  return !oldKeyToIndexMap.has(newComponentResults[newIndex].key) && isReusableRenderResult(newComponentResults[newIndex].result, oldResults[oldIndex]!.result)
}

type RepeatTemplateCache<C, R, N extends Node | null> = {
  oldResults: (RepeatItemData<C, R, N> | null)[]
}
const repeatTemplate = createTemplate(
  (initialInput: RepeatTemplateInput<any, any, any, any>, initialContainer, before) => {
  let oldResults: (RepeatItemData<any, any, any> | null)[] = Array.from(initialInput.values, (itemData, i) => {
    const componentResult = figureOutComponentResult(initialInput.mapFn(itemData, i));
    if (componentResult !== null) {
      const key = initialInput.keyFn(itemData, i);
      const result = renderComponentResultNoSet(itemData.result, initialContainer, before);
      return repeatItemData(key, result, null);  
    }
    return null;
  }).filter(itemData => itemData !== null);
  let previousFirstNode = before;
  for(let i = oldResults.length - 1; i >= 0; i--) {
    const oldResult = oldResults[i] as RepeatItemData<any, any, any>;
    if (oldResult.result.firstNode) {
      previousFirstNode = oldResult.result.firstNode
    }
    oldResult.firstNode = previousFirstNode;
  }
  const state: RepeatTemplateCache<any, any, any> = {oldResults};
  return cloneInfo(oldResults.length > 0 ? (oldResults[0] as RepeatItemData<any, any, any>).firstNode : before, state);
},
(state: RepeatTemplateCache<any, any, any>, newInput: RepeatTemplateInput<any, any, any, any>, container: Node, before: Node | null) => {
  const oldResults = state.oldResults;
    const newComponentResults: RepeatComponentData<any, any, any>[] = Array.from(newInput.values, (itemValue, i) => {
      const componentResult = figureOutComponentResult(newInput.mapFn(itemValue, i));
      if (componentResult !== null) {
        const key = newInput.keyFn(itemValue, i);
        return { key, result: componentResult }
      }
      return null;
    }).filter(itemValue => itemValue !== null) as any[];
    
    const oldLength = oldResults.length;
    const newLength = newComponentResults.length;

    const newRenderResults: RepeatItemData<any, any, any>[] = [];

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
      } else if (oldResults[oldHead]!.key === newComponentResults[newHead].key) {
        // Old head matches new head; update in place
        newRenderResults[newHead] = renderRepeatItem(oldResults[oldHead]!, newComponentResults[newHead], container, oldHead + 1 >= oldLength ? before : oldResults[oldHead + 1]!.firstNode);
        oldHead++;
        newHead++;
      } else if (oldResults[oldTail]!.key === newComponentResults[newTail].key) {
        // Old tail matches new tail; update in place
        newRenderResults[newTail] = renderRepeatItem(oldResults[oldTail]!, newComponentResults[newTail], container, oldTail + 1 >= oldLength ? before : oldResults[oldTail + 1]!.firstNode);
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
          oldResults[oldHead + 1]!.firstNode,
          newTail + 1 < newLength ? newRenderResults[newTail + 1].firstNode : before,
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
          newTail + 1 < newLength ? newRenderResults[newTail + 1]!.firstNode : before,
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
        if (!newKeyToIndexMap.has(oldResults[oldHead]!.key)) {
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
          const oldNextMarker = oldHead + 1 < oldLength ? oldResults[oldHead + 1]!.firstNode : before;
          if (canReuseRemovedPart(oldKeyToIndexMap, newComponentResults, oldResults, newHead, oldHead)) {
            // The new head and old head don't exist in each other's lists but they share the same template; reuse
            newRenderResults[newHead] = renderRepeatItem(oldResults[oldHead]!, newComponentResults[newHead], container, oldNextMarker);
            newHead++;
          } else {
            // Old head is no longer in new list; remove
            removeUntilBefore(container, oldResults[oldHead]!.firstNode, oldNextMarker);
          }
          oldHead++;
        } else if (!newKeyToIndexMap.has(oldResults[oldTail]!.key)) {
          const oldNextMarker = newTail < newLength ? newRenderResults[newTail].firstNode : before;
          if (canReuseRemovedPart(oldKeyToIndexMap, newComponentResults, oldResults, newTail, oldTail)) {
            // The new tail and old tail don't exist in each other's lists but they share the same template; reuse
            newRenderResults[newTail] = renderRepeatItem(oldResults[oldTail]!, newComponentResults[newTail], container, oldNextMarker);
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
          const oldIndex = oldKeyToIndexMap.get(newComponentResults[newHead].key);
          if (oldIndex === undefined) {
            newRenderResults[newHead] = insertPartBefore(
              newComponentResults,
              newHead,
              container,
              oldHead < oldLength ? oldResults[oldHead]!.firstNode : before
            );
          } else {
            newRenderResults[newHead] = movePart(
              oldResults as any,
              newComponentResults,
              oldIndex,
              newHead,
              container,
              oldResults[oldIndex]!.firstNode,
              oldResults[oldHead]!.firstNode,
            );
            oldResults[oldIndex] = null;
          }
          newHead++;
        }
      }
    }
    
    if (oldHead <= oldTail) {
      const firstToRemoveMarker = oldResults[oldHead]!.firstNode;
      const lastToRemoveMarker = newTail + 1 < newLength ? newRenderResults[newTail + 1]!.firstNode : before;
      removeUntilBefore(container, firstToRemoveMarker, lastToRemoveMarker);
    } else {
      // Add parts for any remaining new values
      const insertAdditionalPartsBefore = newTail + 1 < newLength ? newRenderResults[newTail + 1].firstNode : before;
      while (newHead <= newTail) {
        newRenderResults[newHead] = insertPartBefore(
          newComponentResults,
          newHead,
          container,
          insertAdditionalPartsBefore
        );
        newHead++;
      }
    }
    state.oldResults = newRenderResults;
  }
);

export const repeat = <V, C, R, CR extends ComponentResult<C, R, any>>(values: Iterable<V>, keyFn: KeyFn<V>, mapFn: MapFn<V, CR>): ComponentResult<RepeatTemplateCache<C, R, any>, RepeatTemplateInput<V, C, R, any>, any> => {
  return {
    template: repeatTemplate,
    value: { values, keyFn, mapFn }
  };
}

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
    // TODO: Shouldn't be null
    return null;
  });
  return (props: P) => ({
    template: stateTemplate,
    value: props
  })
};*/