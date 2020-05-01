"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var nextid = 0;

var generateBlueprintUid = () => nextid++;

export var renderData = (first, state) => ({
  first,
  state
});
export var createBlueprint = (mount, update, unmount) => ({
  id: generateBlueprintUid(),
  mount,
  update,
  unmount
});

class CachedField {
  constructor() {
    _defineProperty(this, "state", null);
  }

  init(fieldValues, v) {
    var value = fieldValues[v++];
    this.set(value);
    this.state = value;
    return v;
  }

  update(fieldValues, v) {
    var value = fieldValues[v++];

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

export var attribute = (el, key) => {
  return new AttributeField(el, key);
};

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

export var property = (el, setter) => {
  return new PropertyField(el, setter);
};

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

export var event = (el, key) => {
  return new EventField(el, key);
};
var textBlueprint = createBlueprint((value, container, before) => {
  var node = document.createTextNode(value.toString());
  container.insertBefore(node, before);
  return renderData(node, node);
}, (state, value) => {
  if (state.state.data !== value) {
    state.state.data = value.toString();
  }
});
export var renderResult = (id, data, unmount) => ({
  id,
  data,
  unmount
});
export var renderComponentResultNoSet = (renderInfo, container, before) => {
  var blueprint = renderInfo.blueprint;
  var data = blueprint.mount(renderInfo.value, container, before);
  return renderResult(blueprint.id, data, blueprint.unmount);
};
export var componentResult = (blueprint, value) => ({
  blueprint,
  value
});
export var replaceOldResult = (renderInfo, container, oldResult, before) => {
  if (oldResult.unmount !== undefined) {
    oldResult.unmount(oldResult.data.state);
  }

  removeUntilBefore(container, oldResult.data.first, before);
  return renderComponentResultNoSet(renderInfo, container, before);
};

var indexKeyer = (item, i) => i;

export var componentResultFromValue = value => {
  var valueType = typeof value;

  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return componentResult(textBlueprint, value);
  } else if (value[Symbol.iterator] !== undefined) {
    return map(value, indexKeyer, componentResultFromValue);
  } else {
    return value;
  }
};
var trackedNodes = new WeakMap();
export var render = (value, container) => {
  var renderResult = renderValue(value, trackedNodes.get(container), container, null);
  trackedNodes.set(container, renderResult);
};
export var updateComponentResultsArray = (newComponentResults, results, oldHead, newHead, oldLength, newLength, container, before) => {
  var newRenderResults = new Array(newLength); // Head and tail pointers to old parts and new values

  var oldTail = oldLength - 1;
  var newTail = newLength - 1;

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
      var oldNextMarker = oldHead + 1 < oldLength ? results[oldHead + 1].data.first : before;
      removeUntilBefore(container, results[oldHead].data.first, oldNextMarker);
      oldHead++;
    }
  }

  if (oldHead <= oldTail) {
    var firstToRemoveMarker = results[oldHead].data.first;
    var lastToRemoveMarker = newTail + 1 < newLength ? newRenderResults[newTail + 1].data.first : before;
    removeUntilBefore(container, firstToRemoveMarker, lastToRemoveMarker);
  } else {
    // Add parts for any remaining new values
    var insertAdditionalPartsBefore = newTail + 1 < newLength ? newRenderResults[newTail + 1].data.first : before;
    var i = newHead;

    while (i <= newTail) {
      newRenderResults[i] = renderComponentResultNoSet(newComponentResults[i], container, insertAdditionalPartsBefore);
      i++;
    }
  }

  return newRenderResults;
};
var mapBlueprint = createBlueprint((initialValues, container, before) => {
  var results = [];
  var j = 0;
  var marker = document.createComment('');
  container.insertBefore(marker, before);

  for (var itemData of initialValues) {
    if (itemData != null) {
      var _componentResult = componentResultFromValue(itemData);

      results[j++] = renderComponentResultNoSet(_componentResult, container, before);
    }
  }

  var state = {
    results
  };
  return renderData(marker, state);
}, (state, newInput, container, before) => {
  var results = state.state.results;
  var newComponentResults = [];
  var j = 0;

  for (var itemValue of newInput) {
    if (itemValue != null) {
      var _componentResult2 = componentResultFromValue(itemValue);

      newComponentResults[j++] = _componentResult2;
    }
  }

  var oldLength = results.length;
  var newLength = newComponentResults.length; // Head and tail pointers to old parts and new values

  var oldHead = 0;
  var newHead = 0;
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
    for (var result of this.state) {
      if (result !== undefined && result.unmount !== undefined) {
        result.unmount(result.data.state);
      }
    }
  }

  init(fieldValues, v) {
    return this.update(fieldValues, v);
  }

  update(fieldValues, v) {
    var container = this.el;
    var before = this.before;
    var f = 0;

    do {
      var fieldValue = fieldValues[v];
      var _state = this.state[f];
      this.state[f] = renderValue(fieldValue, _state, container, before);

      if (_state !== undefined) {
        before = _state.data.first;
      }

      v++;
      f++;
    } while (f < this.state.length);

    return v;
  }

}

export var dynamicSection = (el, before, length) => {
  return new DynamicSection(el, before, length);
};

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
    var value = fieldValues[v++];
    this.state = renderValue(value, this.state, this.el, this.before);
    return v;
  }

  unmount() {
    if (this.state !== undefined && this.state.unmount !== undefined) {
      this.state.unmount(this.state.data.state);
    }
  }

}

export var children = (el, before) => {
  return new ChildrenField(el, before);
};
export var staticFragmentBlueprint = html => {
  var template = document.createElement('template');
  template.innerHTML = html;
  var rootElement = template.content;
  return createBlueprint((nothing, container, before) => {
    var cloned = document.importNode(rootElement, true);
    container.insertBefore(cloned, before);
    var first = cloned.firstChild;
    return renderData(first);
  });
};
export var staticElementBlueprint = html => {
  var template = document.createElement('template');
  template.innerHTML = html;
  var rootElement = template.content.firstChild;
  return createBlueprint((nothing, container, before) => {
    var cloned = document.importNode(rootElement, true);
    container.insertBefore(cloned, before);
    return renderData(cloned);
  });
};
export var renderOrReuseComponentResult = (componentResult, oldResult, container, before) => {
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
export var renderValue = (value, oldResult, container, before) => {
  if (value == null) {
    if (oldResult !== undefined) {
      removeUntilBefore(container, oldResult.data.first, before);
    }

    return undefined;
  }

  var componentResult = componentResultFromValue(value);
  return renderOrReuseComponentResult(componentResult, oldResult, container, before);
};

var initialDomFieldSetter = (fields, fieldValues) => {
  var v = 0;

  for (var f = 0; f < fields.length; f++) {
    v = fields[f].init(fieldValues, v);
  }
};

var domFieldSetter = (result, fieldValues) => {
  var v = 0;
  var fields = result.state;

  for (var f = 0; f < fields.length; f++) {
    v = fields[f].update(fieldValues, v);
  }
};

var domFieldUnmount = fields => {
  for (var field of fields) {
    if (field.unmount !== undefined) {
      field.unmount();
    }
  }
};

export var elementBlueprint = (html, fieldFactory) => {
  var template = document.createElement('template');
  template.innerHTML = html;
  var rootElement = template.content.firstChild;
  return createBlueprint((fieldValues, container, before) => {
    var cloned = document.importNode(rootElement, true);
    var fields = fieldFactory(cloned);
    initialDomFieldSetter(fields, fieldValues);
    container.insertBefore(cloned, before);
    return renderData(cloned, fields);
  }, domFieldSetter, domFieldUnmount);
};
export var fragmentBlueprint = (html, fieldFactory) => {
  var template = document.createElement('template');
  template.innerHTML = html;
  var rootElement = template.content;
  return createBlueprint((fieldValues, container, before) => {
    var cloned = document.importNode(rootElement, true);
    var first = cloned.firstChild;
    var fields = fieldFactory(cloned);
    initialDomFieldSetter(fields, fieldValues);
    container.insertBefore(cloned, before);
    return renderData(first, fields);
  }, domFieldSetter, domFieldUnmount);
};

class SpreadField {
  constructor(el) {
    this.el = el;

    _defineProperty(this, "state", {});
  }

  init(fieldValues, v) {
    return this.update(fieldValues, v);
  }

  update(fieldValues, v) {
    var value = fieldValues[v++];
    applySpread(this.el, this.state, value);
    return v;
  }

}

export var spread = el => {
  return new SpreadField(el);
};
export var removeUntilBefore = (container, startElement, stopElement) => {
  while (startElement !== stopElement) {
    var nextSibling = startElement.nextSibling;
    container.removeChild(startElement);
    startElement = nextSibling;
  }
};
export var moveUntilBefore = (newContainer, startElement, stopElement, before) => {
  while (startElement !== stopElement) {
    var nextSibling = startElement.nextSibling;
    newContainer.insertBefore(startElement, before);
    startElement = nextSibling;
  }
};

var setAttribute = (el, key, value) => {
  if (value != null) {
    el.setAttribute(key, value);
  } else {
    el.removeAttribute(key);
  }
};

var removeEvent = (el, key, eventObject) => {
  if (eventObject != null) {
    if (typeof eventObject === 'function') {
      el.removeEventListener(key, eventObject);
    } else {
      el.removeEventListener(key, eventObject.handle, eventObject.options);
    }
  }
};

var setEvent = (el, key, state, newValue) => {
  removeEvent(el, key, state);

  if (newValue !== null && newValue !== undefined) {
    if (typeof newValue === 'function') {
      el.addEventListener(key, newValue);
    } else {
      el.addEventListener(key, newValue.handle, newValue.options);
    }
  }
};

var EVENT_PREFIX_REGEX = /^\$\$/;
var PROPERTY_PREFIX_REGEX = /^\$/;
var EVENT_TYPE = 0;
var PROPERTY_TYPE = 1;
var ATTRIBUTE_TYPE = 2;

var fieldInfo = (type, key) => ({
  type,
  key
});

var fieldInfoFromKey = key => {
  if (key.match(EVENT_PREFIX_REGEX)) {
    return fieldInfo(EVENT_TYPE, key.replace(EVENT_PREFIX_REGEX, ''));
  } else if (key.match(PROPERTY_PREFIX_REGEX)) {
    return fieldInfo(PROPERTY_TYPE, key.replace(PROPERTY_PREFIX_REGEX, ''));
  } else {
    return fieldInfo(ATTRIBUTE_TYPE, key);
  }
};

var applySpread = (el, state, newValue) => {
  var newKeys = new Set();

  for (var [prefixedKey, _value] of Object.entries(newValue)) {
    newKeys.add(prefixedKey);

    if (state[prefixedKey] !== _value) {
      var {
        type,
        key: _key
      } = fieldInfoFromKey(prefixedKey);

      switch (type) {
        case ATTRIBUTE_TYPE:
          setAttribute(el, _key, _value);
          break;

        case PROPERTY_TYPE:
          el[_key] = _value;
          break;

        case EVENT_TYPE:
          setEvent(el, _key, state, _value);
          break;
      }
    }
  }

  for (var _prefixedKey in state) {
    if (newKeys.has(_prefixedKey)) {
      continue;
    }

    var {
      type: _type,
      key: _key2
    } = fieldInfoFromKey(_prefixedKey);

    switch (_type) {
      case ATTRIBUTE_TYPE:
        el.removeAttribute(_key2);
        break;

      case PROPERTY_TYPE:
        el[_key2] = undefined;
        break;

      case EVENT_TYPE:
        removeEvent(el, _key2, newValue);
        break;
    }
  }
};

var isReusableRenderResult = (componentResult, renderResult) => {
  return renderResult.id === componentResult.blueprint.id;
};

// Helper for generating a map of array item to its index over a subset
// of an array (used to lazily generate `newKeyToIndexMap` and
// `oldKeyToIndexMap`)
var generateMap = (list, start, end) => {
  var map = new Map();

  for (var i = start; i <= end; i++) {
    map.set(list[i], i);
  }

  return map;
};

var movePart = (oldResult, newResult, container, oldNextMarker, before) => {
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

var canReuseRemovedPart = (oldKeyToIndexMap, newComponentResults, newKeys, results, newIndex, oldIndex) => {
  return !oldKeyToIndexMap.has(newKeys[newIndex]) && isReusableRenderResult(newComponentResults[newIndex], results[oldIndex]);
};

export var repeatBlueprint = createBlueprint((initialInput, initialContainer, before) => {
  var results = [];
  var keys = [];
  var i = 0;
  var j = 0;
  var marker = document.createComment('');
  initialContainer.insertBefore(marker, before);

  for (var itemData of initialInput.values) {
    if (itemData != null) {
      var _componentResult3 = componentResultFromValue(initialInput.mapFn(itemData, i));

      var _key3 = initialInput.keyFn(itemData, i);

      var result = renderComponentResultNoSet(_componentResult3, initialContainer, before);
      keys[j] = _key3;
      results[j] = result;
      j++;
    }

    i++;
  }

  var state = {
    results,
    keys
  };
  return renderData(marker, state);
}, (state, newInput, container, before) => {
  var {
    results,
    keys
  } = state.state;
  var newComponentResults = [];
  var newKeys = [];
  var i = 0;
  var j = 0;

  for (var itemValue of newInput.values) {
    if (itemValue != null) {
      var _componentResult4 = componentResultFromValue(newInput.mapFn(itemValue, i));

      var _key4 = newInput.keyFn(itemValue, i);

      newKeys[j] = _key4;
      newComponentResults[j] = _componentResult4;
      j++;
    }

    i++;
  }

  var oldLength = results.length;
  var newLength = newComponentResults.length;
  var newRenderResults = new Array(newLength); // Maps from key to index for current and previous update; these
  // are generated lazily only when needed as a performance
  // optimization, since they are only required for multiple
  // non-contiguous changes in the list, which are less common.

  var newKeyToIndexMap;
  var oldKeyToIndexMap; // Head and tail pointers to old parts and new values

  var oldHead = 0;
  var oldTail = oldLength - 1;
  var newHead = 0;
  var newTail = newLength - 1;

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
      var nextOldHead = oldHead + 1; // Old head matches new head; update in place

      newRenderResults[newHead] = renderOrReuseComponentResult(newComponentResults[newHead], results[oldHead], container, nextOldHead >= oldLength ? before : results[nextOldHead].data.first);
      oldHead = nextOldHead;
      newHead++;
    } else if (keys[oldTail] === newKeys[newTail]) {
      var nextOldTail = oldTail + 1; // Old tail matches new tail; update in place

      newRenderResults[newTail] = renderOrReuseComponentResult(newComponentResults[newTail], results[oldTail], container, nextOldTail >= oldLength ? before : results[nextOldTail].data.first);
      oldTail--;
      newTail--;
    } else if (keys[oldHead] === newKeys[newTail]) {
      // Old head matches new tail; update and move to new tail
      var _nextOldHead = oldHead + 1;

      var _nextNewTail = newTail + 1;

      newRenderResults[newTail] = movePart(results[oldHead], newComponentResults[newTail], container, results[_nextOldHead].data.first, _nextNewTail < newLength ? newRenderResults[_nextNewTail].data.first : before);
      oldHead = _nextOldHead;
      newTail--;
    } else if (keys[oldTail] === newKeys[newHead]) {
      var _nextNewTail2 = newTail + 1; // Old tail matches new head; update and move to new head


      newRenderResults[newHead] = movePart(results[oldTail], newComponentResults[newHead], container, _nextNewTail2 < newLength ? newRenderResults[_nextNewTail2].data.first : before, results[oldHead].data.first);
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
        var _nextOldHead2 = oldHead + 1;

        var oldNextMarker = _nextOldHead2 < oldLength ? results[_nextOldHead2].data.first : before;

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
        var _oldNextMarker = newTail < newLength ? newRenderResults[newTail].data.first : before;

        if (canReuseRemovedPart(oldKeyToIndexMap, newComponentResults, newKeys, results, newTail, oldTail)) {
          // The new tail and old tail don't exist in each other's lists but they share the same blueprint; reuse
          newRenderResults[newTail] = renderOrReuseComponentResult(newComponentResults[newTail], results[oldTail], container, _oldNextMarker);
          newTail--;
        } else {
          // Old tail is no longer in new list; remove
          removeUntilBefore(container, results[oldTail].data.first, _oldNextMarker);
        }

        oldTail--;
      } else {
        // Any mismatches at this point are due to additions or
        // moves; see if we have an old part we can reuse and move
        // into place
        var oldIndex = oldKeyToIndexMap.get(newKeys[newHead]);

        if (oldIndex === undefined) {
          newRenderResults[newHead] = renderComponentResultNoSet(newComponentResults[newHead], container, oldHead < oldLength ? results[oldHead].data.first : before);
        } else {
          var nextOldIndex = oldIndex + 1;
          newRenderResults[newHead] = movePart(results[oldIndex], newComponentResults[newHead], container, nextOldIndex < oldLength ? results[nextOldIndex].data.first : before, results[oldHead].data.first);
          results[oldIndex] = null;
        }

        newHead++;
      }
    }
  }

  var nextNewTail = newTail + 1;

  if (oldHead <= oldTail) {
    var firstToRemoveMarker = results[oldHead].data.first;
    var lastToRemoveMarker = nextNewTail < newLength ? newRenderResults[nextNewTail].data.first : before;
    removeUntilBefore(container, firstToRemoveMarker, lastToRemoveMarker);
  } else {
    // Add parts for any remaining new values
    var insertAdditionalPartsBefore = nextNewTail < newLength ? newRenderResults[nextNewTail].data.first : before;

    while (newHead <= newTail) {
      newRenderResults[newHead] = renderComponentResultNoSet(newComponentResults[newHead], container, insertAdditionalPartsBefore);
      newHead++;
    }
  }

  state.state.results = newRenderResults;
  state.state.keys = newKeys;
});

var keyedComponents = (values, keyFn, mapFn, recycle) => {
  return componentResult(repeatBlueprint, {
    values,
    keyFn,
    mapFn,
    recycle
  });
};

export var map = (values, keyFn, mapFn) => {
  return keyedComponents(values, keyFn, mapFn, true);
};
export var repeat = (values, keyFn, mapFn) => {
  return keyedComponents(values, keyFn, mapFn, false);
};
export var rerender = target => {
  var symbol = Symbol("".concat(target.key.toString(), "-value"));

  if (target.kind === 'field') {
    return _objectSpread({}, target, {
      key: symbol,
      extras: [{
        kind: 'method',
        key: target.key,
        placement: 'prototype',
        descriptor: {
          get: function get() {
            return this[symbol];
          },
          set: function set(value) {
            this[symbol] = value;
            this[UPDATE]();
          }
        }
      }]
    });
  } else {
    var descriptor = (() => {
      var oldDescriptor = target.descriptor;

      if (oldDescriptor.value !== undefined) {
        return _objectSpread({}, oldDescriptor, {
          value: function value() {
            this[symbol](...arguments);
            this[UPDATE]();
          }
        });
      } else if (oldDescriptor.set !== undefined) {
        return _objectSpread({}, oldDescriptor, {
          set: function set(value) {
            this[symbol] = value;
            this[UPDATE]();
          }
        });
      } else {
        throw new Error("Expected either a field, method or setter");
      }
    })();

    return _objectSpread({}, target, {
      key: symbol,
      extras: [_objectSpread({}, target, {
        descriptor
      })]
    });
  }
};
export var UPDATE = Symbol('update');
export class RootlessDomElement extends HTMLElement {
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
    var result = this.render();
    render(result, this.renderRoot);
  }

}
export class LightDomElement extends RootlessDomElement {
  mountRenderRoot() {
    return this;
  }

}
export class DomElement extends RootlessDomElement {
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
//# sourceMappingURL=index.js.map
