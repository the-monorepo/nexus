export type NonUndefined<T> = Exclude<T, undefined>;

export type TransformOptionsSchema = Partial<
  Record<string | number | symbol, (...args: any[]) => any>
>;

export type TypeHolder<T> = { type: T };
export type TypedObjectSchema = TypeHolder<string>;
export type TypedResultfulSchema = TypedObjectSchema & { [s: string]: any };

export type Include<Type, Included> = Exclude<Type, Exclude<Type, Included>>;

export type TransformTypedObject<
  ResultObjectType extends TypedObjectSchema,
  OptionsObjectType extends TransformOptionsSchema,
  OptionsKey extends keyof TransformOptionsSchema,
  ResultType extends ResultObjectType['type'],
> = ResultType extends ResultObjectType['type']
  ? OptionsObjectType[OptionsKey] extends (...args: any[]) => any
    ? ReturnType<NonUndefined<OptionsObjectType[OptionsKey]>>
    : Include<ResultObjectType, TypeHolder<ResultType>>
  : Include<ResultObjectType, TypeHolder<ResultType>>;

export type ResultTransformer<T, V, R> = (value: V, result: T) => R;
export type ResultTransformerOption<
  Key extends string | number | symbol,
  T,
  V,
  R,
> = Record<Key, ResultTransformer<T, V, R>>;

export type OptionIfTypeElseEmpty<
  R extends TypedResultfulSchema,
  ResultType,
  ResultKey extends keyof R,
  HandlerReturnType,
> = ResultType extends R['type']
  ? ResultTransformerOption<
      ResultKey,
      Include<R, TypeHolder<ResultType>>,
      Include<R, TypeHolder<ResultType>>[ResultKey],
      HandlerReturnType
    >
  : Record<string, never>;
