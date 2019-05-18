let nextTemplateId = 0;
const generateTemplateUid = () => nextTemplateId++;

type CloneFn<V> = (v: V, container: Node, trackerNode: Node, before: Node | null) => CloneInfo<V>;
type Id = number | any;
type GeneralCloneFn = (...args: any[]) => CloneInfo<any>;
type Template<C extends GeneralCloneFn> = {
  id: Id,
  clone: C,
};
type ChildTemplate<V> = Template<(value: V, container: Node) => CloneInfo<V>>;
type ComponentTemplate<V> = Template<CloneFn<V>>;

const createTemplate = <C extends GeneralCloneFn>(clone: C): Template<C> => ({
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

const memoizedPropInfo = <T>(onSet) => {
  let value;
  return {
    set: (newValue: T)=> {
      if(newValue === value) {
        return;
      }
      onSet(newValue, value);
      value = newValue;
    },
  };
}
type MemoizedPropInfo = ReturnType<typeof memoizedPropInfo>;

export const attribute = <E extends Element = any>(el: E, key: string) => {
  assertNodeExists(el);
  return memoizedPropInfo(
    (newValue) => {
      if (newValue != null) {
        el.setAttribute(key, newValue);
      } else {
        el.removeAttribute(key);
      }
    }
  )
}
type AttributeField = ReturnType<typeof attribute>;

export const property = (setter: (value: any) => void) => {
  return memoizedPropInfo(setter);
};
type PropertyField = ReturnType<typeof property>;

export const event = <E extends Element = any>(el: E, key: string) => {
  assertNodeExists(el);
  return memoizedPropInfo(
    (newValue, oldValue) => {
      if (oldValue != null) {
        if (typeof oldValue === 'function') {
          el.removeEventListener(key, oldValue);
        } else {
          el.removeEventListener(key, oldValue.handle, oldValue.options);
        }
      }
      if (newValue != null) {
        if (typeof newValue === 'function') {
          el.addEventListener(key, newValue);
        } else {
          el.addEventListener(key, newValue.handle, newValue.options);
        }
      } 
    }
  )
};
type EventField = ReturnType<typeof event>;

type Field = AttributeField | PropertyField | EventField;
const removeOldResultIfExists = (trackerNode: Node, oldResult?: RenderResult<any>) => {
  if (oldResult) {
    removeOldResult(oldResult);
    trackedNodes.delete(trackerNode);
  }
};

type ChildResult = {
  firstNode: Node,
  before: Node | null
};
type TextTemplateInput = string | boolean | number | any;
const textTemplate: ComponentTemplate<TextTemplateInput> = createTemplate((initialValue: TextTemplateInput, container: Node, trackerNode, before: Node | null) => {
  const textNode = document.createTextNode(initialValue.toString());
  container.insertBefore(textNode, before);
  return cloneInfo(textNode, textNode, (value: TextTemplateInput) => {
    textNode.data = value.toString();
  });
});

const rerenderArray = (items: any[], container: Node, marker: Node, before: Node | null) => {
  const nodeAfterMarker = marker.nextSibling;
  if (nodeAfterMarker) {
    removeUntilBefore(nodeAfterMarker, before);
  }
  const fragment = document.createDocumentFragment();
  const filteredItems = items.filter((v) => v != null);
  for(const item of filteredItems) {
    const itemMarker = document.createComment('');
    fragment.appendChild(itemMarker);
    renderComponentResult(item, fragment, itemMarker, null);
  }
  container.insertBefore(fragment, before);
};

const mapTemplate: ComponentTemplate<any[]> = createTemplate((initialValue: any[], container: Node, marker: Node, before: Node | null) => {
  rerenderArray(initialValue, container, marker, before);
  return cloneInfo(marker, marker, (value: any[]) => {
    rerenderArray(value, container, marker, before);
  });
});

const figureOutComponentResult = (
  value: any,
) => {
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

export const children = <N extends Node>(marker: N): MemoizedPropInfo => {
  assertNodeExists(marker);
  const before = marker.nextSibling;
  return {
    set: (newValue) => {
      assertNodeExists(marker.parentNode);
      const componentResult = figureOutComponentResult(newValue);
      checkAndRenderComponentResult(componentResult, marker.parentNode as Node, marker, trackedNodes.get(marker), before);
    }
  };
}
type Fields = ReadonlyArray<MemoizedPropInfo>;
type FieldFactory = <E extends Node = any>(root: E) => Fields;
export const elementTemplate = (
  html: string,
  fieldFactory?: FieldFactory
): ComponentTemplate<any[] | undefined> => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return createTemplate(
    (initialValues: any[], container: Node, trackerNode, before: Node | null) => {
      const cloned = document.importNode(template.content.firstChild as Node, true);
      container.insertBefore(cloned, before);
      const setFn = fieldFactory ? (() => {
        const fields = fieldFactory(cloned);
        setFieldValues(fields, initialValues);
        return (fieldValues: any[]) => {
          setFieldValues(fields, fieldValues);
        }
      })() : undefined;
      return cloneInfo(cloned, cloned, setFn);
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

export const componentResult = <C extends GeneralCloneFn, V>(template: Template<C>, value: V): ComponentResult<V> => ({
  template,
  value
});


type RenderResult<V> = {
  templateId: Id,
  set?: SetFn<V>,
  firstNode: Node,
  before: Node | null,
};

const removeUntilBefore = (startElement: Node, stopElement: Node | null) => {
  let currentElement = startElement;
  while(currentElement !== stopElement) {
    const nextSibling = currentElement.nextSibling!;
    currentElement.parentNode!.removeChild(currentElement);
    currentElement = nextSibling;
  }
}

const setFieldValues = (fields: Fields, fieldValues: any[]) => {
  for(let f = 0; f < fieldValues.length; f++) {
    const field = fields[f];
    const fieldValue = fieldValues[f];
    field.set(fieldValue);
  }
};

export type KeyFn<T> = (item: T, index: number) => any;
export type MapFn<T, R> = (item: T, index: number) => R;
export type SetFn<V> = (value: V) => any;
const cloneInfo = <N extends Node, V>(root: N, firstNode: N, set?: SetFn<V>): CloneInfo<V> => ({
  root, 
  firstNode,
  set
});
type CloneInfo<V> = {
  root: Node,
  firstNode: Node,
  set?: SetFn<V>,
};

const trackedNodes = new WeakMap<Node, RenderResult<any>>();

const renderComponentResult = <V>(
  renderInfo: ComponentResult<V>,
  container: Node,
  trackerNode: Node,
  before: Node | null = null
): RenderResult<V> => {
  const cloneInfo = renderInfo.template.clone(renderInfo.value, container, trackerNode, before);
  const result: RenderResult<V> = {
    templateId: renderInfo.template.id,
    // TODO: remove any
    set: cloneInfo.set,
    firstNode: cloneInfo.firstNode,
    before,
  };
  trackedNodes.set(trackerNode, result);
  return result;
}

const removeOldResult = (oldResult: RenderResult<any>) => {
  removeUntilBefore(oldResult.firstNode, oldResult.before);
}
const checkAndRenderComponentResult = <V>(
  renderInfo: ComponentResult<V>,
  container: Node,
  trackerNode: Node,
  oldResult?: RenderResult<any>,
  before: Node | null = null
) => {
  if (oldResult) {
    if (renderInfo.template.id === oldResult.templateId && oldResult.set) {
      oldResult.set(renderInfo.value);
    } else {
      removeOldResult(oldResult);
      renderComponentResult(renderInfo, container, trackerNode, before);
    }
  } else {
    renderComponentResult(renderInfo, container, trackerNode, before);
  }
};

export const render = <V>(value: ComponentResult<V>, container: Node) => {
  return checkAndRenderComponentResult(value, container, container, trackedNodes.get(container), null);
}
