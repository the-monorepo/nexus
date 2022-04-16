export type { FailureType } from '@resultful/failure-types';
import {
  ResultTransformer,
  TransformTypedObject,
  OptionIfTypeElseEmpty,
} from '@resultful/utility-types';
import { ERROR, UNKNOWN } from '@resultful/failure-types';
export { ERROR, UNKNOWN } from '@resultful/failure-types';

export type ErrorFailure<ErrorType> = {
  type: typeof ERROR;
  error: ErrorType;
  unknown: undefined;
};

export type UnknownError = {
  type: typeof UNKNOWN;
  error: undefined;
  unknown: unknown;
};

export type Failure<ErrorType> = ErrorFailure<ErrorType> | UnknownError;

export const isError = <R extends TypedObjectSchema>(
  result: R,
): result is Include<R, TypeHolder<typeof ERROR>> => result.type === ERROR;

export const isUnknown = <R extends TypedObjectSchema>(
  result: R,
): result is Include<R, TypeHolder<typeof UNKNOWN>> => result.type === UNKNOWN;

export type Include<Type, Included> = Exclude<Type, Exclude<Type, Included>>;

export type CreateErrorFn = {
  <P>(payload: P): ErrorFailure<P>;
  (error?: undefined): ErrorFailure<undefined>;
};

export type CreateUnknownFn = (unknown: unknown) => UnknownError;

export const error: CreateErrorFn = <E>(error: E): ErrorFailure<E> => ({
  type: ERROR,
  error,
  unknown: undefined,
});

export const unknown: CreateUnknownFn = (unknown: unknown): UnknownError => ({
  type: UNKNOWN,
  error: undefined,
  unknown,
});

export type ErrorHandler<A, R> = ResultTransformer<ErrorFailure<A>, A, R>;
export type UnknownHandler<R> = ResultTransformer<UnknownError, unknown, R>;

export type HandleErrorOptions<E, ER> = {
  error: ErrorHandler<E, ER>;
};

export type HandleUnknownOptions<UR> = {
  unknown: UnknownHandler<UR>;
};

export type HandleFailureOptions<E, ER, UR> = HandleErrorOptions<E, ER> &
  HandleUnknownOptions<UR>;

export type HandleOptions<E, ER, UR> = Partial<HandleFailureOptions<E, ER, UR>>;

export type TransformOptionsSchema = Partial<
  Record<string | number | symbol, (...args: any[]) => any>
>;
export type TypeHolder<T> = { type: T };
export type TypedObjectSchema = TypeHolder<string>;
export type TypedResultfulSchema = TypedObjectSchema & { [s: string]: any };

export type HandledErrorResult<
  R extends TypedObjectSchema,
  O extends TransformOptionsSchema,
> = TransformTypedObject<R, O, 'payload', typeof ERROR>;

export type HandledUnknownResult<
  R extends TypedObjectSchema,
  O extends TransformOptionsSchema,
> = TransformTypedObject<R, O, 'unknown', typeof UNKNOWN>;

export type HandledResult<R extends TypedObjectSchema, O extends TransformOptionsSchema> =
  HandledErrorResult<R, O> | HandledUnknownResult<R, O>;

export type FullOptionsBasedOnResult<R extends TypedResultfulSchema, ER, UR> =
  OptionIfTypeElseEmpty<R, typeof ERROR, 'error', ER> &
    OptionIfTypeElseEmpty<R, typeof UNKNOWN, 'unknown', UR>;

export type OptionsBasedOnResult<R extends TypedResultfulSchema, ER, UR> = Partial<
  FullOptionsBasedOnResult<R, ER, UR>
>;

export type TransformFn = {
  <R extends TypedResultfulSchema>(result: R, options?: undefined): typeof result;
  <
    R extends TypedResultfulSchema,
    O extends OptionsBasedOnResult<R, any, any> &
      Record<string | number | symbol, unknown>,
  >(
    result: R,
    options: O,
  ): HandledResult<typeof result, typeof options>;
};

/**
 * This is exactly the same as {@link handle} except there is no try { ... } catch { ... } wrapper around the handlers.
 * This may improve performance but removes the guarentee that nothing will ever be thrown by the handle function.
 */
export const transformResult: TransformFn = <E, ER, UR>(
  result: Failure<E>,
  handlers: HandleOptions<E, ER, UR> = {},
) => {
  switch (result.type) {
    case ERROR: {
      const { error } = result;
      if (handlers.error !== undefined) {
        return handlers.error(error, result);
      }
      break;
    }

    case UNKNOWN: {
      const { unknown } = result;
      if (handlers.unknown !== undefined) {
        return handlers.unknown(unknown, result);
      }
      break;
    }
  }

  return result;
};

export type HandleFn = {
  <R extends TypedResultfulSchema>(result: R, options?: undefined): typeof result;
  <
    R extends TypedResultfulSchema,
    O extends OptionsBasedOnResult<R, any, any> &
      Record<string | number | symbol, unknown>,
  >(
    result: R,
    options: O,
  ): HandledResult<typeof result, typeof options>;
};

export type ValueOf<R extends TypedResultfulSchema> = R extends ErrorFailure<infer E>
  ? E
  : R extends UnknownError
  ? 1
  : never;
const passThrough = <T>(value: T) => value;
export type ValueOfFn = <F extends Failure<any>>(result: F) => ValueOf<F>;
export const valueOf: ValueOfFn = <E>(result: Failure<E>): any =>
  transformResult(result, {
    error: passThrough,
    unknown: passThrough,
  });
