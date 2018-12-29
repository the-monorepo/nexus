export type HookCallback<P extends any[] = any[], T = any> = (...params: P) => T;
export type HookCallbackFactory<P extends any[] = any[], T = any> = () => HookCallback<
  P,
  T
>;
export type Hook<B extends any[] = any[], BR = any, A extends any[] = any[], AR = any> = {
  before: HookCallback<B, BR>;
  after: HookCallback<A, AR>;
};

type NonArrayHookSchemaValue = null | HookSchema | HookCallbackFactory;
export type HookSchemaValue =
  | NonArrayHookSchemaValue
  | (NonArrayHookSchemaValue | MergeOptions)[]; // TODO: Could use a tuple but array literals don't get interpreted as tuples which causes type errors when there aren't any

export type HookSchema = {
  [k: string]: HookSchemaValue;
};

export type Hooks<H extends HookSchema> = {
  [K in keyof H]: H[K] extends HookSchema
    ? Hooks<H[K]>
    : H[K] extends HookCallbackFactory
    ? ReturnType<H[K]>
    : HookCallback;
};

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends Record<string, any>
    ? RecursivePartial<T[P]>
    : T[P];
};

export type CompleteHooksOptions<K extends HookSchema, O extends HookSchema> = {
  before: Hooks<K>;
  after: Hooks<K>;
  on: Hooks<O>;
};

export type HookOptions<K extends HookSchema, O extends HookSchema> = {
  before?: RecursivePartial<Hooks<K>>;
  after?: RecursivePartial<Hooks<K>>;
  on?: RecursivePartial<Hooks<O>>;
};

export type HookOptionsOf<T> = Parameters<T['withNoops']>[0];
export type CompleteHookOptionsOf<T> = ReturnType<T['withNoops']>;

export function defaultHook(): HookCallback {
  return async () => {};
}

export function defaultHooksFromSchema<H extends HookSchema>(
  schemaObj: H,
  hooksObj: RecursivePartial<Hooks<H>> = {},
): Hooks<H> {
  return Object.keys(schemaObj).reduce((hooks, key: keyof H) => {
    if (!hooks[key]) {
      // TODO: There's some type errors that occur for whatever reason with as any. Need to remove them
      if (schemaObj[key] === null) {
        hooks[key] = (async () => {}) as any;
      } else if (typeof schemaObj[key] === 'function') {
        hooks[key] = (schemaObj[key] as HookCallbackFactory)() as any;
      } else {
        hooks[key] = defaultHooksFromSchema(schemaObj[key] as HookSchema, {}) as any;
      }
    }
    return hooks;
  }, hooksObj) as Hooks<H>;
}

const mergeHookCallback = (filteredHooksList: HookCallback[]) => {
  const callHooks = async (...params) => {
    for (const callback of filteredHooksList as HookCallback[]) {
      await Promise.resolve(callback(...params));
    }
  };
  return callHooks;
};
/**
 * Wraps the calls of a set of hooks into a single call
 * @param hooksList The list of hooks
 * @param hookSchema The schema that the hooks are based off
 */
export function mergeHooks<H extends HookSchema>(
  hooksList: (RecursivePartial<Hooks<H>> | HookCallback | undefined)[],
  value: H | null | HookCallbackFactory | [H | null | HookCallbackFactory, MergeOptions],
): Hooks<H> {
  const filteredHooksList = hooksList.filter((hooks) => !!hooks) as (
    | RecursivePartial<Hooks<H>>
    | HookCallback
  )[];
  if (Array.isArray(value)) {
    const arr = value as any as [H | null | HookCallbackFactory, MergeOptions];
    const options: MergeOptions = arr[1];
    const callHooks = options.yield
      ? function* callHooks(...params) {
          for (const callback of filteredHooksList as HookCallback[]) {
            yield Promise.resolve(callback(...params));
          }
        }
      : mergeHookCallback(filteredHooksList as HookCallback[]);
    return callHooks as any;
  } else if (typeof value === 'function' || value === null) {
    const merged = mergeHookCallback(filteredHooksList as HookCallback[]);
    /*
      TODO: This breaks the returned type contract, although only when the hooksList
      is a list of hook callbacks (as opposed to a hook object)
    */
    return merged as any;
  } else {
    return Object.keys(value).reduce((merged, key) => {
      merged[key] = mergeHooks(
        filteredHooksList.map((hooks) => hooks[key]),
        value[key] as any,
      );
      return merged;
    }, {}) as Hooks<H>;
  }
}

export type MergeOptions = {
  yield?: boolean;
};
export function mergeHookOptions<H extends HookSchema, O extends HookSchema>(
  hookOptionsList: (HookOptions<H, O> | undefined)[],
  beforeAfterSchemaObj: H,
  onSchemaObj: O = {} as any,
): CompleteHooksOptions<H, O> {
  const definedHookOptionsList = hookOptionsList.filter(
    (hookOptions) => !!hookOptions,
  ) as (HookOptions<H, O> | RecursivePartial<Hooks<H>>)[];
  return {
    before: mergeHooks(
      definedHookOptionsList
        .filter((hookOptions) => !!hookOptions.before)
        .map((hookOptions) => hookOptions.before as RecursivePartial<Hooks<H>>),
      beforeAfterSchemaObj,
    ),
    after: mergeHooks(
      definedHookOptionsList
        .filter((hookOptions) => !!hookOptions.after)
        .map((hookOptions) => hookOptions.after as RecursivePartial<Hooks<H>>),
      beforeAfterSchemaObj,
    ),
    on: mergeHooks(
      definedHookOptionsList
        .filter((hookOptions) => !!hookOptions.on)
        .map((hookOptions) => hookOptions.on as RecursivePartial<Hooks<O>>),
      onSchemaObj,
    ),
  };
}

export function fromSchema<H extends HookSchema, O extends HookSchema>(
  beforeAfterSchemaObj: H,
  onSchemaObj: O = {} as any,
) {
  return {
    withNoops: (partialHooks: HookOptions<H, O> = {}): CompleteHooksOptions<H, O> => {
      return {
        on: defaultHooksFromSchema(onSchemaObj, partialHooks.on),
        before: defaultHooksFromSchema(beforeAfterSchemaObj, partialHooks.before),
        after: defaultHooksFromSchema(beforeAfterSchemaObj, partialHooks.after),
      };
    },
    merge: (hookOptions: (HookOptions<H, O> | undefined)[]): CompleteHooksOptions<H, O> =>
      mergeHookOptions(hookOptions, beforeAfterSchemaObj, onSchemaObj),
  };
}
export default fromSchema;
