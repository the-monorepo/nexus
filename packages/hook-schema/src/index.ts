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

export interface HookOptions<K extends HookSchema> {
  before?: RecursivePartial<Hooks<K>>;
  after?: RecursivePartial<Hooks<K>>;
}

export interface CompleteHooksOptions<K extends HookSchema> {
  before: Hooks<K>;
  after: Hooks<K>;
}

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

export function schema<H extends HookSchema>(schemaObj: H) {
  return (partialHooks: HookOptions<H> = {}): CompleteHooksOptions<H> => {
    return {
      before: defaultHooksFromSchema(schemaObj, partialHooks.before),
      after: defaultHooksFromSchema(schemaObj, partialHooks.after),
    };
  };
}
export default schema;

export function mergeHooks<H extends HookSchema>(
  hooksList: Array<RecursivePartial<Hooks<H>> | HookCallback | undefined>,
  hookSchema: H | null | HookCallbackFactory,
): Hooks<H> {
  const filteredHooksList = hooksList.filter(hooks => hooks !== undefined) as Array<
    RecursivePartial<Hooks<H>> | HookCallback
  >;
  if (typeof hookSchema === 'function' || hookSchema === null) {
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
    return Object.keys(hookSchema).reduce((merged, key) => {
      merged[key] = mergeHooks(filteredHooksList.map(hooks => hooks[key]), hookSchema[
        key
      ] as HookSchema);
      return merged;
    }, {}) as Hooks<H>;
  }
}

export function mergeHookOptions<H extends HookSchema>(
  hookOptionsList: Array<HookOptions<H> | undefined>,
  hookSchema: H,
): CompleteHooksOptions<H> {
  return {
    before: mergeHooks(
      hookOptionsList
        .filter(hookOptions => hookOptions && hookOptions.before)
        .map(hookOptions => hookOptions!.before as RecursivePartial<Hooks<H>>),
      hookSchema,
    ),
    after: mergeHooks(
      hookOptionsList
        .filter(hookOptions => hookOptions && hookOptions.after)
        .map(hookOptions => hookOptions!.after as RecursivePartial<Hooks<H>>),
      hookSchema,
    ),
  };
}
