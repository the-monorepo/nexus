"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DomElement = exports.LightDomElement = exports.RootlessDomElement = exports.UPDATE = exports.rerender = exports.repeat = exports.map = exports.repeatBlueprint = exports.moveUntilBefore = exports.removeUntilBefore = exports.spread = exports.fragmentBlueprint = exports.elementBlueprint = exports.renderValue = exports.renderOrReuseComponentResult = exports.staticElementBlueprint = exports.staticFragmentBlueprint = exports.children = exports.dynamicSection = exports.updateComponentResultsArray = exports.render = exports.componentResultFromValue = exports.replaceOldResult = exports.componentResult = exports.renderComponentResultNoSet = exports.renderResult = exports.event = exports.property = exports.attribute = exports.createBlueprint = exports.renderData = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

let nextid = 0;

const generateBlueprintUid = () => nextid++;

const renderData = (first, state) => ({
  first,
  state
});

exports.renderData = renderData;

const createBlueprint = (mount, update, unmount) => ({
  id: generateBlueprintUid(),
  mount,
  update,
  unmount
});

exports.createBlueprint = createBlueprint;

class CachedField {
  constructor() {
    _defineProperty(this, "state", null);
  }

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

class AttributeField extends CachedField {
  constructor(el, key) {
    super();
    this.el = el;
    this.key = key;
  }

  set(value) {
    setAttribute(this.el, this.key, value);
  }

}

const attribute = (el, key) => {
  return new AttributeField(el, key);
};

exports.attribute = attribute;

class PropertyField extends CachedField {
  constructor(el, setter) {
    super();
    this.el = el;
    this.setter = setter;
  }

  set(value) {
    this.setter(this.el, value);
  }

}

const property = (el, setter) => {
  return new PropertyField(el, setter);
};

exports.property = property;

class EventField extends CachedField {
  constructor(el, key) {
    super();
    this.el = el;
    this.key = key;
  }

  set(value) {
    setEvent(this.el, this.key, this.state, value);
  }

}

const event = (el, key) => {
  return new EventField(el, key);
};

exports.event = event;
const textBlueprint = createBlueprint((value, container, before) => {
  const node = document.createTextNode(value.toString());
  container.insertBefore(node, before);
  return renderData(node, node);
}, (state, value) => {
  if (state.state.data !== value) {
    state.state.data = value.toString();
  }
});

const renderResult = (id, data, unmount) => ({
  id,
  data,
  unmount
});

exports.renderResult = renderResult;

const renderComponentResultNoSet = (renderInfo, container, before) => {
  const blueprint = renderInfo.blueprint;
  const data = blueprint.mount(renderInfo.value, container, before);
  return renderResult(blueprint.id, data, blueprint.unmount);
};

exports.renderComponentResultNoSet = renderComponentResultNoSet;

const componentResult = (blueprint, value) => ({
  blueprint,
  value
});

exports.componentResult = componentResult;

const replaceOldResult = (renderInfo, container, oldResult, before) => {
  if (oldResult.unmount !== undefined) {
    oldResult.unmount(oldResult.data.state);
  }

  removeUntilBefore(container, oldResult.data.first, before);
  return renderComponentResultNoSet(renderInfo, container, before);
};

exports.replaceOldResult = replaceOldResult;

const indexKeyer = (item, i) => i;

const componentResultFromValue = value => {
  const valueType = typeof value;

  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return componentResult(textBlueprint, value);
  } else if (value[Symbol.iterator] !== undefined) {
    return map(value, indexKeyer, componentResultFromValue);
  } else {
    return value;
  }
};

exports.componentResultFromValue = componentResultFromValue;
const trackedNodes = new WeakMap();

const render = (value, container) => {
  const renderResult = renderValue(value, trackedNodes.get(container), container, null);
  trackedNodes.set(container, renderResult);
};

exports.render = render;

const updateComponentResultsArray = (newComponentResults, results, oldHead, newHead, oldLength, newLength, container, before) => {
  const newRenderResults = new Array(newLength); // Head and tail pointers to old parts and new values

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
    } else if (results[oldHead].id === newComponentResults[newHead].blueprint.id) {
      // Old head matches new head; update in place
      newRenderResults[newHead] = renderOrReuseComponentResult(newComponentResults[newHead], results[oldHead], container, oldHead + 1 >= oldLength ? before : results[oldHead + 1].data.first);
      oldHead++;
      newHead++;
    } else if (results[oldTail].id === newComponentResults[newTail].blueprint.id) {
      // Old tail matches new tail; update in place
      newRenderResults[newTail] = renderOrReuseComponentResult(newComponentResults[newTail], results[oldTail], container, oldTail + 1 >= oldLength ? before : results[oldTail + 1].data.first);
      oldTail--;
      newTail--;
    } else if (results[oldHead].id === newComponentResults[newTail].blueprint.id) {
      // Old head matches new tail; update and move to new tail
      newRenderResults[newTail] = renderOrReuseComponentResult(newComponentResults[newTail], results[oldHead], container, newTail + 1 < newLength ? newRenderResults[newTail + 1].data.first : before);
      newTail--;
      oldHead++;
    } else if (results[oldTail].id === newComponentResults[newHead].blueprint.id) {
      // Old tail matches new head; update and move to new head
      newRenderResults[newTail] = renderOrReuseComponentResult(newComponentResults[newHead], results[oldTail], container, results[oldHead].data.first);
      newHead++;
      oldTail++;
    } else {
      const oldNextMarker = oldHead + 1 < oldLength ? results[oldHead + 1].data.first : before;
      removeUntilBefore(container, results[oldHead].data.first, oldNextMarker);
      oldHead++;
    }
  }

  if (oldHead <= oldTail) {
    const firstToRemoveMarker = results[oldHead].data.first;
    const lastToRemoveMarker = newTail + 1 < newLength ? newRenderResults[newTail + 1].data.first : before;
    removeUntilBefore(container, firstToRemoveMarker, lastToRemoveMarker);
  } else {
    // Add parts for any remaining new values
    const insertAdditionalPartsBefore = newTail + 1 < newLength ? newRenderResults[newTail + 1].data.first : before;
    let i = newHead;

    while (i <= newTail) {
      newRenderResults[i] = renderComponentResultNoSet(newComponentResults[i], container, insertAdditionalPartsBefore);
      i++;
    }
  }

  return newRenderResults;
};

exports.updateComponentResultsArray = updateComponentResultsArray;
const mapBlueprint = createBlueprint((initialValues, container, before) => {
  const results = [];
  let j = 0;
  const marker = document.createComment('');
  container.insertBefore(marker, before);

  for (const itemData of initialValues) {
    if (itemData != null) {
      const componentResult = componentResultFromValue(itemData);
      results[j++] = renderComponentResultNoSet(componentResult, container, before);
    }
  }

  const state = {
    results
  };
  return renderData(marker, state);
}, (state, newInput, container, before) => {
  const results = state.state.results;
  const newComponentResults = [];
  let j = 0;

  for (const itemValue of newInput) {
    if (itemValue != null) {
      const componentResult = componentResultFromValue(itemValue);
      newComponentResults[j++] = componentResult;
    }
  }

  const oldLength = results.length;
  const newLength = newComponentResults.length; // Head and tail pointers to old parts and new values

  const oldHead = 0;
  const newHead = 0;
  state.state.results = updateComponentResultsArray(newComponentResults, results, oldHead, newHead, oldLength, newLength, container, before);
});

class DynamicSection {
  constructor(el, before, length) {
    this.el = el;
    this.before = before;

    _defineProperty(this, "state", void 0);

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

const dynamicSection = (el, before, length) => {
  return new DynamicSection(el, before, length);
};

exports.dynamicSection = dynamicSection;

class ChildrenField {
  constructor(el, before) {
    this.el = el;
    this.before = before;

    _defineProperty(this, "state", undefined);
  }

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

const children = (el, before) => {
  return new ChildrenField(el, before);
};

exports.children = children;

const staticFragmentBlueprint = html => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement = template.content;
  return createBlueprint((nothing, container, before) => {
    const cloned = document.importNode(rootElement, true);
    container.insertBefore(cloned, before);
    const first = cloned.firstChild;
    return renderData(first);
  });
};

exports.staticFragmentBlueprint = staticFragmentBlueprint;

const staticElementBlueprint = html => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement = template.content.firstChild;
  return createBlueprint((nothing, container, before) => {
    const cloned = document.importNode(rootElement, true);
    container.insertBefore(cloned, before);
    return renderData(cloned);
  });
};

exports.staticElementBlueprint = staticElementBlueprint;

const renderOrReuseComponentResult = (componentResult, oldResult, container, before) => {
  if (oldResult === undefined) {
    return renderComponentResultNoSet(componentResult, container, before);
  } else if (isReusableRenderResult(componentResult, oldResult)) {
    if (componentResult.blueprint.update !== undefined) {
      componentResult.blueprint.update(oldResult.data, componentResult.value, container, before);
    }

    return oldResult;
  } else {
    return replaceOldResult(componentResult, container, oldResult, before);
  }
};

exports.renderOrReuseComponentResult = renderOrReuseComponentResult;

const renderValue = (value, oldResult, container, before) => {
  if (value == null) {
    if (oldResult !== undefined) {
      removeUntilBefore(container, oldResult.data.first, before);
    }

    return undefined;
  }

  const componentResult = componentResultFromValue(value);
  return renderOrReuseComponentResult(componentResult, oldResult, container, before);
};

exports.renderValue = renderValue;

const initialDomFieldSetter = (fields, fieldValues) => {
  let v = 0;

  for (let f = 0; f < fields.length; f++) {
    v = fields[f].init(fieldValues, v);
  }
};

const domFieldSetter = (result, fieldValues) => {
  let v = 0;
  const fields = result.state;

  for (let f = 0; f < fields.length; f++) {
    v = fields[f].update(fieldValues, v);
  }
};

const domFieldUnmount = fields => {
  for (const field of fields) {
    if (field.unmount !== undefined) {
      field.unmount();
    }
  }
};

const elementBlueprint = (html, fieldFactory) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement = template.content.firstChild;
  return createBlueprint((fieldValues, container, before) => {
    const cloned = document.importNode(rootElement, true);
    const fields = fieldFactory(cloned);
    initialDomFieldSetter(fields, fieldValues);
    container.insertBefore(cloned, before);
    return renderData(cloned, fields);
  }, domFieldSetter, domFieldUnmount);
};

exports.elementBlueprint = elementBlueprint;

const fragmentBlueprint = (html, fieldFactory) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const rootElement = template.content;
  return createBlueprint((fieldValues, container, before) => {
    const cloned = document.importNode(rootElement, true);
    const first = cloned.firstChild;
    const fields = fieldFactory(cloned);
    initialDomFieldSetter(fields, fieldValues);
    container.insertBefore(cloned, before);
    return renderData(first, fields);
  }, domFieldSetter, domFieldUnmount);
};

exports.fragmentBlueprint = fragmentBlueprint;

class SpreadField {
  constructor(el) {
    this.el = el;

    _defineProperty(this, "state", {});
  }

  init(fieldValues, v) {
    return this.update(fieldValues, v);
  }

  update(fieldValues, v) {
    const value = fieldValues[v++];
    applySpread(this.el, this.state, value);
    return v;
  }

}

const spread = el => {
  return new SpreadField(el);
};

exports.spread = spread;

const removeUntilBefore = (container, startElement, stopElement) => {
  while (startElement !== stopElement) {
    const nextSibling = startElement.nextSibling;
    container.removeChild(startElement);
    startElement = nextSibling;
  }
};

exports.removeUntilBefore = removeUntilBefore;

const moveUntilBefore = (newContainer, startElement, stopElement, before) => {
  while (startElement !== stopElement) {
    const nextSibling = startElement.nextSibling;
    newContainer.insertBefore(startElement, before);
    startElement = nextSibling;
  }
};

exports.moveUntilBefore = moveUntilBefore;

const setAttribute = (el, key, value) => {
  if (value != null) {
    el.setAttribute(key, value);
  } else {
    el.removeAttribute(key);
  }
};

const removeEvent = (el, key, eventObject) => {
  if (eventObject != null) {
    if (typeof eventObject === 'function') {
      el.removeEventListener(key, eventObject);
    } else {
      el.removeEventListener(key, eventObject.handle, eventObject.options);
    }
  }
};

const setEvent = (el, key, state, newValue) => {
  removeEvent(el, key, state);

  if (newValue !== null && newValue !== undefined) {
    if (typeof newValue === 'function') {
      el.addEventListener(key, newValue);
    } else {
      el.addEventListener(key, newValue.handle, newValue.options);
    }
  }
};

const EVENT_PREFIX_REGEX = /^\$\$/;
const PROPERTY_PREFIX_REGEX = /^\$/;
const EVENT_TYPE = 0;
const PROPERTY_TYPE = 1;
const ATTRIBUTE_TYPE = 2;

const fieldInfo = (type, key) => ({
  type,
  key
});

const fieldInfoFromKey = key => {
  if (key.match(EVENT_PREFIX_REGEX)) {
    return fieldInfo(EVENT_TYPE, key.replace(EVENT_PREFIX_REGEX, ''));
  } else if (key.match(PROPERTY_PREFIX_REGEX)) {
    return fieldInfo(PROPERTY_TYPE, key.replace(PROPERTY_PREFIX_REGEX, ''));
  } else {
    return fieldInfo(ATTRIBUTE_TYPE, key);
  }
};

const applySpread = (el, state, newValue) => {
  const newKeys = new Set();

  for (const [prefixedKey, value] of Object.entries(newValue)) {
    newKeys.add(prefixedKey);

    if (state[prefixedKey] !== value) {
      const {
        type,
        key
      } = fieldInfoFromKey(prefixedKey);

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

    const {
      type,
      key
    } = fieldInfoFromKey(prefixedKey);

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

const isReusableRenderResult = (componentResult, renderResult) => {
  return renderResult.id === componentResult.blueprint.id;
};

// Helper for generating a map of array item to its index over a subset
// of an array (used to lazily generate `newKeyToIndexMap` and
// `oldKeyToIndexMap`)
const generateMap = (list, start, end) => {
  const map = new Map();

  for (let i = start; i <= end; i++) {
    map.set(list[i], i);
  }

  return map;
};

const movePart = (oldResult, newResult, container, oldNextMarker, before) => {
  if (isReusableRenderResult(newResult, oldResult)) {
    moveUntilBefore(container, oldResult.data.first, oldNextMarker, before);

    if (newResult.blueprint.update !== undefined) {
      newResult.blueprint.update(oldResult.data.state, newResult.value, container, before);
    }

    return oldResult;
  } else {
    return replaceOldResult(newResult, container, oldResult, before);
  }
};

const canReuseRemovedPart = (oldKeyToIndexMap, newComponentResults, newKeys, results, newIndex, oldIndex) => {
  return !oldKeyToIndexMap.has(newKeys[newIndex]) && isReusableRenderResult(newComponentResults[newIndex], results[oldIndex]);
};

const repeatBlueprint = createBlueprint((initialInput, initialContainer, before) => {
  const results = [];
  const keys = [];
  let i = 0;
  let j = 0;
  const marker = document.createComment('');
  initialContainer.insertBefore(marker, before);

  for (const itemData of initialInput.values) {
    if (itemData != null) {
      const componentResult = componentResultFromValue(initialInput.mapFn(itemData, i));
      const key = initialInput.keyFn(itemData, i);
      const result = renderComponentResultNoSet(componentResult, initialContainer, before);
      keys[j] = key;
      results[j] = result;
      j++;
    }

    i++;
  }

  const state = {
    results,
    keys
  };
  return renderData(marker, state);
}, (state, newInput, container, before) => {
  const {
    results,
    keys
  } = state.state;
  const newComponentResults = [];
  const newKeys = [];
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
  const newRenderResults = new Array(newLength); // Maps from key to index for current and previous update; these
  // are generated lazily only when needed as a performance
  // optimization, since they are only required for multiple
  // non-contiguous changes in the list, which are less common.

  let newKeyToIndexMap;
  let oldKeyToIndexMap; // Head and tail pointers to old parts and new values

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
      const nextOldHead = oldHead + 1; // Old head matches new head; update in place

      newRenderResults[newHead] = renderOrReuseComponentResult(newComponentResults[newHead], results[oldHead], container, nextOldHead >= oldLength ? before : results[nextOldHead].data.first);
      oldHead = nextOldHead;
      newHead++;
    } else if (keys[oldTail] === newKeys[newTail]) {
      const nextOldTail = oldTail + 1; // Old tail matches new tail; update in place

      newRenderResults[newTail] = renderOrReuseComponentResult(newComponentResults[newTail], results[oldTail], container, nextOldTail >= oldLength ? before : results[nextOldTail].data.first);
      oldTail--;
      newTail--;
    } else if (keys[oldHead] === newKeys[newTail]) {
      // Old head matches new tail; update and move to new tail
      const nextOldHead = oldHead + 1;
      const nextNewTail = newTail + 1;
      newRenderResults[newTail] = movePart(results[oldHead], newComponentResults[newTail], container, results[nextOldHead].data.first, nextNewTail < newLength ? newRenderResults[nextNewTail].data.first : before);
      oldHead = nextOldHead;
      newTail--;
    } else if (keys[oldTail] === newKeys[newHead]) {
      const nextNewTail = newTail + 1; // Old tail matches new head; update and move to new head

      newRenderResults[newHead] = movePart(results[oldTail], newComponentResults[newHead], container, nextNewTail < newLength ? newRenderResults[nextNewTail].data.first : before, results[oldHead].data.first);
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
        const oldNextMarker = nextOldHead < oldLength ? results[nextOldHead].data.first : before;

        if (canReuseRemovedPart(oldKeyToIndexMap, newComponentResults, newKeys, results, newHead, oldHead)) {
          // The new head and old head don't exist in each other's lists but they share the same blueprint; reuse
          newRenderResults[newHead] = renderOrReuseComponentResult(newComponentResults[newHead], results[oldHead], container, oldNextMarker);
          newHead++;
        } else {
          // Old head is no longer in new list; remove
          removeUntilBefore(container, results[oldHead].data.first, oldNextMarker);
        }

        oldHead++;
      } else if (!newKeyToIndexMap.has(keys[oldTail])) {
        const oldNextMarker = newTail < newLength ? newRenderResults[newTail].data.first : before;

        if (canReuseRemovedPart(oldKeyToIndexMap, newComponentResults, newKeys, results, newTail, oldTail)) {
          // The new tail and old tail don't exist in each other's lists but they share the same blueprint; reuse
          newRenderResults[newTail] = renderOrReuseComponentResult(newComponentResults[newTail], results[oldTail], container, oldNextMarker);
          newTail--;
        } else {
          // Old tail is no longer in new list; remove
          removeUntilBefore(container, results[oldTail].data.first, oldNextMarker);
        }

        oldTail--;
      } else {
        // Any mismatches at this point are due to additions or
        // moves; see if we have an old part we can reuse and move
        // into place
        const oldIndex = oldKeyToIndexMap.get(newKeys[newHead]);

        if (oldIndex === undefined) {
          newRenderResults[newHead] = renderComponentResultNoSet(newComponentResults[newHead], container, oldHead < oldLength ? results[oldHead].data.first : before);
        } else {
          const nextOldIndex = oldIndex + 1;
          newRenderResults[newHead] = movePart(results[oldIndex], newComponentResults[newHead], container, nextOldIndex < oldLength ? results[nextOldIndex].data.first : before, results[oldHead].data.first);
          results[oldIndex] = null;
        }

        newHead++;
      }
    }
  }

  const nextNewTail = newTail + 1;

  if (oldHead <= oldTail) {
    const firstToRemoveMarker = results[oldHead].data.first;
    const lastToRemoveMarker = nextNewTail < newLength ? newRenderResults[nextNewTail].data.first : before;
    removeUntilBefore(container, firstToRemoveMarker, lastToRemoveMarker);
  } else {
    // Add parts for any remaining new values
    const insertAdditionalPartsBefore = nextNewTail < newLength ? newRenderResults[nextNewTail].data.first : before;

    while (newHead <= newTail) {
      newRenderResults[newHead] = renderComponentResultNoSet(newComponentResults[newHead], container, insertAdditionalPartsBefore);
      newHead++;
    }
  }

  state.state.results = newRenderResults;
  state.state.keys = newKeys;
});
exports.repeatBlueprint = repeatBlueprint;

const keyedComponents = (values, keyFn, mapFn, recycle) => {
  return componentResult(repeatBlueprint, {
    values,
    keyFn,
    mapFn,
    recycle
  });
};

const map = (values, keyFn, mapFn) => {
  return keyedComponents(values, keyFn, mapFn, true);
};

exports.map = map;

const repeat = (values, keyFn, mapFn) => {
  return keyedComponents(values, keyFn, mapFn, false);
};

exports.repeat = repeat;

const rerender = target => {
  const symbol = Symbol(`${target.key.toString()}-value`);

  if (target.kind === 'field') {
    return { ...target,
      key: symbol,
      extras: [{
        kind: 'method',
        key: target.key,
        placement: 'prototype',
        descriptor: {
          get: function () {
            return this[symbol];
          },
          set: function (value) {
            this[symbol] = value;
            this[UPDATE]();
          }
        }
      }]
    };
  } else {
    const descriptor = (() => {
      const oldDescriptor = target.descriptor;

      if (oldDescriptor.value !== undefined) {
        return { ...oldDescriptor,
          value: function (...args) {
            this[symbol](...args);
            this[UPDATE]();
          }
        };
      } else if (oldDescriptor.set !== undefined) {
        return { ...oldDescriptor,
          set: function (value) {
            this[symbol] = value;
            this[UPDATE]();
          }
        };
      } else {
        throw new Error(`Expected either a field, method or setter`);
      }
    })();

    return { ...target,
      key: symbol,
      extras: [{ ...target,
        descriptor
      }]
    };
  }
};

exports.rerender = rerender;
const UPDATE = Symbol('update');
exports.UPDATE = UPDATE;

class RootlessDomElement extends HTMLElement {
  constructor() {
    super();

    _defineProperty(this, "renderRoot", void 0);

    this.renderRoot = this.mountRenderRoot();
  }

  connectedCallback() {
    this[UPDATE]();
  }

  disconnectedCallback() {
    render(null, this.renderRoot);
  }

  [UPDATE]() {
    const result = this.render();
    render(result, this.renderRoot);
  }

}

exports.RootlessDomElement = RootlessDomElement;

class LightDomElement extends RootlessDomElement {
  mountRenderRoot() {
    return this;
  }

}

exports.LightDomElement = LightDomElement;

class DomElement extends RootlessDomElement {
  mountRenderRoot() {
    return this.attachShadow({
      mode: 'open'
    });
  }

}
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
  const stateBlueprint = createBlueprint((initialProps: P, container, before) => {
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
        if (componentResult.blueprint.update) {
          componentResult.blueprint.update(previousRenderResult.state, props, container, before);
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
    blueprint: stateBlueprint,
    value: props
  })
};*/


exports.DomElement = DomElement;
//# sourceMappingURL=index.js.map
