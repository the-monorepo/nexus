export type HookCallback<P extends any[] = any[], T = any> = (...params: P) => Promise<T>;
export type HookCallbackFactory<P extends any[] = any[], T = any> = () => HookCallback<
  P,
  T
>;
export interface Hook<
  B extends any[] = any[],
  BR = any,
  A extends any[] = any[],
  AR = any
> {
  before: HookCallback<B, BR>;
  after: HookCallback<A, AR>;
}

export type HookSchemaValue = null | HookSchema | HookCallbackFactory;

export interface HookSchema {
  [k: string]: HookSchemaValue;
}

export type Hooks<H extends HookSchema> = {
  [K in keyof H]: H[K] extends HookSchema
    ? Hooks<H[K]>
    : H[K] extends HookCallbackFactory
    ? ReturnType<H[K]>
    : HookCallback
};

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<RecursivePartial<U>>
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P]
};

export interface CompleteHooksOptions<K extends HookSchema, O extends HookSchema> {
  before: Hooks<K>;
  after: Hooks<K>;
  on: Hooks<O>;
}

export type HookOptions<K extends HookSchema, O extends HookSchema> = {
  before?: RecursivePartial<Hooks<K>>;
  after?: RecursivePartial<Hooks<K>>;
  on?: RecursivePartial<Hooks<O>>;
};

export type HookOptionsOf<T extends any> = Parameters<T['withHooks']>[0];

export function defaultHook(): HookCallback {
  return async () => {};
}

export function defaultHooksFromSchema<H extends HookSchema>(
  schemaObj: H,
  hooksObj: RecursivePartial<Hooks<H>> = {},
): Hooks<H> {
  return Object.keys(schemaObj).reduce((hooks, key) => {
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

export function fromSchema<H extends HookSchema, O extends HookSchema>(
  beforeAfterSchemaObj: H,
  onSchemaObj: O = {} as any,
) {
  return {
    withHooks: (partialHooks: HookOptions<H, O> = {}): CompleteHooksOptions<H, O> => {
      return {
        on: defaultHooksFromSchema(onSchemaObj, partialHooks.on),
        before: defaultHooksFromSchema(beforeAfterSchemaObj, partialHooks.before),
        after: defaultHooksFromSchema(beforeAfterSchemaObj, partialHooks.after),
      };
    },
    mergeHookOptions: (options: Array<HookOptions<H, O> | undefined>) =>
      mergeHookOptions(options, beforeAfterSchemaObj, onSchemaObj),
  };
}
export default fromSchema;

/**
 * Wraps the calls of a set of hooks into a single call
 * @param hooksList The list of hooks
 * @param hookSchema The schema that the hooks are based off
 */
export function mergeHooks<H extends HookSchema>(
  hooksList: Array<RecursivePartial<Hooks<H>> | HookCallback | undefined>,
  value: H | null | HookCallbackFactory,
): Hooks<H> {
  const filteredHooksList = hooksList.filter(hooks => !!hooks) as Array<
    RecursivePartial<Hooks<H>> | HookCallback
  >;
  if (typeof value === 'function' || value === null) {
    const merged = async (...params) => {
      for (const callback of filteredHooksList as HookCallback[]) {
        await callback(...params);
      }
    };
    /*
      TODO: This breaks the returned type contract, although only when the hooksList
      is a list of hook callbacks (as opposed to a hook object)
    */
    return merged as any;
  } else {
    return Object.keys(value).reduce((merged, key) => {
      merged[key] = mergeHooks(filteredHooksList.map(hooks => hooks[key]), value[key]);
      return merged;
    }, {}) as Hooks<H>;
  }
}

export function mergeHookOptions<H extends HookSchema, O extends HookSchema>(
  hookOptionsList: Array<HookOptions<H, O> | undefined>,
  beforeAfterSchemaObj: H,
  onSchemaObj: O = {} as any,
): CompleteHooksOptions<H, O> {
  const definedHookOptionsList = hookOptionsList.filter(
    hookOptions => !!hookOptions,
  ) as Array<HookOptions<H, O> | RecursivePartial<Hooks<H>>>;
  return {
    before: mergeHooks(
      definedHookOptionsList
        .filter(hookOptions => !!hookOptions.before)
        .map(hookOptions => hookOptions!.before as RecursivePartial<Hooks<H>>),
      beforeAfterSchemaObj,
    ),
    after: mergeHooks(
      definedHookOptionsList
        .filter(hookOptions => !!hookOptions.after)
        .map(hookOptions => hookOptions!.after as RecursivePartial<Hooks<H>>),
      beforeAfterSchemaObj,
    ),
    on: mergeHooks(
      definedHookOptionsList
        .filter(hookOptions => !!hookOptions.on)
        .map(hookOptions => hookOptions!.on as RecursivePartial<Hooks<O>>),
      onSchemaObj,
    ),
  };
}
