import * as ResultTypes from '@resultful/types';
export { ResultTypes };

/**
 * Signifies that something 'worked'. Also known as a "happy path" result.
 */
export type PayloadResult<P> = {
  type: typeof ResultTypes.SUCCESS;
  payload: P;
  /**
   * Only defined for {@link ErrorResult}
   */
  error: undefined;
  /**
   * Only defined for {@link ExceptionResult}
   */
  exception: undefined;
};

export type SuccessResult<P> = PayloadResult<P>;
export type NormalResult<P> = PayloadResult<P>;

/**
 * Signifies that some erroneuous (but known/anticipated) behaviour has ocurred.
 * The difference between this and {@exception} is that this form of error is known to be possible of occuring.
 */
export type ErrorResult<E> = {
  type: typeof ResultTypes.ERROR;
  /**
   * Only defined for {@link PayloadResult}
   */
  payload: undefined;
  error: E;
  /**
   * Only defined for {@link ExceptionResult}
   */
  exception: undefined;
};

/**
 * Signifies that some UNEXPECTED erroneuous behaviour has occurred.
 * This result occurs when there is a bug in the API being consumed or the consumer is consuming the API incorrectly
 * and API has not accounted for such misuse.
 */
export type ExceptionResult<T> = {
  type: typeof ResultTypes.EXCEPTION;
  /**
   * Only defined for {@link PayloadResult}
   */
  payload: undefined;
  /**
   * Only defined for {@link ErrorResult}
   */
  error: undefined;
  exception: T;
};

export type FailureResult<E, EX = any> = ErrorResult<E> | ExceptionResult<EX>;

export type Result<P, E, EX = any> =
  | PayloadResult<P>
  | ErrorResult<E>
  | ExceptionResult<EX>;

/**
 * Check if a result is an {@link ExceptionResult}.
 * @param result being checked
 * @return Returning true signifies that some unexpected (i.e. API creator did not expect/account for the errror) erroneuous behaviour has occurred.
 */
export const isException = <EX = any>(
  result: Result<unknown, unknown, EX>,
): result is ExceptionResult<EX> => result.type === ResultTypes.EXCEPTION;

/**
 * Check if a result is an {@link ErrorResult}.
 * @param result being checked
 * @return Returning true signifies expected (i.e. API creator is aware of the error) erroneuous behaviour has occurred.
 */
export const isError = <R extends TypedObjectSchema>(
  result: R,
): result is Include<R, TypeHolder<typeof ResultTypes.ERROR>> =>
  result.type === ResultTypes.ERROR;

export type Include<Type, Included> = Exclude<Type, Exclude<Type, Included>>;

/**
 * Check if a result is a {@link PayloadResult}.
 * @param result being checked
 * @return Returning true signifies successful/"happy path" behaviour has occurred.
 */
export const isPayload = <R extends TypedObjectSchema>(
  result: R,
): result is Include<R, TypeHolder<typeof ResultTypes.SUCCESS>> =>
  result.type === ResultTypes.SUCCESS;

/**
 * Alias for {@link isPayload}
 */
export const isNormal = isPayload;

/**
 * Alias for {@link isPayload}
 */
export const isSuccess = isPayload;

/**
 * Checks if a result is a {@link FailureResult}.
 * @param result being checked
 * @returns Returning true signifies that erroneous behaviour has occurred (i.e. An {@link exception} or an {@link error}).
 */
export const isFailure = <R extends TypedObjectSchema>(
  result: R,
): result is Include<
  R,
  TypeHolder<typeof ResultTypes.ERROR | typeof ResultTypes.EXCEPTION>
> => {
  switch (result.type) {
    case ResultTypes.ERROR:
    case ResultTypes.EXCEPTION: {
      return true;
    }
    default:
      return false;
  }
};

export type CreatePayloadFn = {
  <P>(payload: P): PayloadResult<P>;
  (payload?: undefined): PayloadResult<undefined>;
};
/**
 * Use this to create a {@link PayloadResult} which signifies that something successful
 * has happened and your API has run as expected and has been consumed correctly (AKA the "happy path").
 */
export const payload: CreatePayloadFn = <P>(payload: P): PayloadResult<P> => ({
  type: ResultTypes.SUCCESS,
  payload,
  error: undefined,
  exception: undefined,
});

/**
 * Alias for {@link payload}
 */
export const success = payload;

/**
 * Alias for {@link payload}
 */
export const normal = payload;

export type CreateErrorFn = {
  <E>(error: E): ErrorResult<E>;
  (error?: undefined): ErrorResult<undefined>;
};
/**
 * Use this to create an {@link ErrorResult} which signifies that either your API has behaved erroneuously in some way but
 * you're aware that the error can occur.
 */
export const error: CreateErrorFn = <E>(error: E): ErrorResult<E> => ({
  type: ResultTypes.ERROR,
  payload: undefined,
  error: error,
  exception: undefined,
});

export type CreateExceptionFn = {
  <EX>(exception: EX): ExceptionResult<EX>;
  (exception?: undefined): ExceptionResult<undefined>;
};
/**
 * Use this to create an {@link ExceptionResult} which signifies that some unexpected,
 * thought-to-be-impossible/didn't-think-about-it type erroneous behaviour has ocurred.
 */
export const exception: CreateExceptionFn = <EX>(exception: EX): ExceptionResult<EX> => {
  return {
    type: ResultTypes.EXCEPTION,
    payload: undefined,
    error: undefined,
    exception,
  };
};

export type ResultHandler<T, V, R> = (value: V, result: T) => R;
export type ResultHandlerOption<Key extends string | number | symbol, T, V, R> = Record<
  Key,
  ResultHandler<T, V, R>
>;

export type PayloadHandler<T, R> = ResultHandler<PayloadResult<T>, T, R>;
export type ErrorHandler<E, R> = ResultHandler<ErrorResult<E>, E, R>;
export type ExceptionHandler<EX, R> = ResultHandler<ExceptionResult<EX>, EX, R>;

export type HandlePayloadOptions<P, PR> = {
  payload: PayloadHandler<P, PR>;
};

export type HandleErrorOptions<E, ER> = {
  error: ErrorHandler<E, ER>;
};

export type HandleExceptionOptions<EX, EXR> = {
  exception: ExceptionHandler<EX, EXR>;
};

export type FullHandleOptions<P, E, EX, PR, ER, EXR> = HandlePayloadOptions<P, PR> &
  HandleErrorOptions<E, ER> &
  HandleExceptionOptions<EX, EXR>;

export type HandleOptions<P, E, EX, PR, ER, EXR> = Partial<
  FullHandleOptions<P, E, EX, PR, ER, EXR>
>;

export type OptionIfTypeElseEmpty<
  R extends TypedResultfulSchema,
  ResultType,
  ResultKey extends keyof R,
  HandlerReturnType
> = ResultType extends R['type']
  ? ResultHandlerOption<
      ResultKey,
      Include<R, TypeHolder<ResultType>>,
      Include<R, TypeHolder<ResultType>>[ResultKey],
      HandlerReturnType
    >
  : {};
export type FullOptionsBasedOnResult<
  R extends TypedResultfulSchema,
  PR,
  ER,
  EXR
> = OptionIfTypeElseEmpty<R, typeof ResultTypes.SUCCESS, 'payload', PR> &
  OptionIfTypeElseEmpty<R, typeof ResultTypes.ERROR, 'error', ER> &
  OptionIfTypeElseEmpty<R, typeof ResultTypes.EXCEPTION, 'exception', EXR>;

export type OptionsBasedOnResult<R extends TypedResultfulSchema, PR, ER, EXR> = Partial<
  FullOptionsBasedOnResult<R, PR, ER, EXR>
>;

type NonUndefined<T> = Exclude<T, undefined>;

export type OptionsSchema = Partial<
  Record<string | number | symbol, (...args: any[]) => any>
>;
export type TypeHolder<T> = { type: T };
export type TypedObjectSchema = TypeHolder<string>;
export type TypedResultfulSchema = TypedObjectSchema & { [s: string]: any };

export type HandledTypedObject<
  ResultObjectType extends TypedObjectSchema,
  OptionsObjectType extends OptionsSchema,
  OptionsKey extends keyof OptionsSchema,
  ResultType extends ResultObjectType['type']
> = ResultType extends ResultObjectType['type']
  ? OptionsObjectType[OptionsKey] extends (...args: any[]) => any
    ? ReturnType<NonUndefined<OptionsObjectType[OptionsKey]>>
    : Include<ResultObjectType, TypeHolder<ResultType>>
  : Include<ResultObjectType, TypeHolder<ResultType>>;

export type HandledPayloadResult<
  R extends TypedObjectSchema,
  O extends OptionsSchema
> = HandledTypedObject<R, O, 'payload', typeof ResultTypes.SUCCESS>;

export type HandledErrorResult<
  R extends TypedObjectSchema,
  O extends OptionsSchema
> = HandledTypedObject<R, O, 'error', typeof ResultTypes.ERROR>;

export type HandledExceptionResult<
  R extends TypedObjectSchema,
  O extends OptionsSchema
> = HandledTypedObject<R, O, 'exception', typeof ResultTypes.EXCEPTION>;

export type HandledResult<R extends TypedObjectSchema, O extends OptionsSchema> =
  | HandledPayloadResult<R, O>
  | HandledErrorResult<R, O>
  | HandledExceptionResult<R, O>;

export type TransformFn = {
  <R extends TypedResultfulSchema>(result: R, options?: undefined): typeof result;
  <
    R extends TypedResultfulSchema,
    O extends OptionsBasedOnResult<R, any, any, any> &
      Record<string | number | symbol, unknown>
  >(
    result: R,
    options: O,
  ): HandledResult<typeof result, typeof options>;
};

/**
 * This is exactly the same as {@link handle} except there is no try { ... } catch { ... } wrapper around the handlers.
 * This may improve performance but removes the guarentee that nothing will ever be thrown by the handle function.
 */
export const transform: TransformFn = <P, E, EX, PR, ER, EXR>(
  result: Result<P, E, EX>,
  handlers: HandleOptions<P, E, EX, PR, ER, EXR> = {},
) => {
  switch (result.type) {
    case ResultTypes.SUCCESS: {
      const { payload } = result;
      if (handlers.payload !== undefined) {
        return handlers.payload(payload, result);
      }
      break;
    }

    case ResultTypes.ERROR: {
      const { error } = result;
      if (handlers.error !== undefined) {
        return handlers.error(error, result);
      }
      break;
    }

    case ResultTypes.EXCEPTION: {
      const { exception } = result;
      if (handlers.exception !== undefined) {
        return handlers.exception(exception, result);
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
    O extends OptionsBasedOnResult<R, any, any, any> &
      Record<string | number | symbol, unknown>
  >(
    result: R,
    options: O,
  ): HandledResult<typeof result, typeof options> | ExceptionResult<unknown>;
};

/**
 * A helper function which executes a relevant handler based on the type of result that is passed into the function.
 * @param result The result that will be handled by one of the applicable handlers
 * @param handlers Callbacks that are used
 * @return Returns whatever is returned by the applicable handler. If no handler for the result exists, the orignal result is returned. Note that if something is thrown by one of the handlers, it is caught by this function and the value of what is caught is returned as via {@link exception}.
 */
export const handle: HandleFn = <P = never, E = never, EX = never, PR = never, ER = never, EXR = never>(
  result: Result<P, E, EX>,
  handlers: HandleOptions<P, E, EX, PR, ER, EXR> = {},
) => {
  try {
    return transform(result, handlers);
  } catch (err) {
    return exception(err);
  }
};

export type ValueOf<R extends TypedResultfulSchema> = R extends SuccessResult<infer P> ? P : R extends ErrorResult<infer E> ? E : R extends ExceptionResult<infer EX> ? EX : never;
export type ValueOfFn = <R extends Result<any, any, any>>(result: R) => ValueOf<R>;
export const valueOf: ValueOfFn = <P, E, EX>(result: Result<P, E, EX>): P | E | EX => {
  return transform(result, {
    payload: (payload) => payload,
    error: (error) => error,
    exception: (exception) => exception, 
  });
};
