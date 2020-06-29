import * as types from '@resultful/types';
export { types };

/**
 * Signifies that something 'worked'. Also known as a "happy path" result.
 */
export type SuccessResult<P> = {
  type: typeof types.SUCCESS,
  payload: P,
  /**
   * Only defined for {@link ErrorResult}
   */
  error: undefined,
  /**
   * Only defined for {@link ExceptionResult}
   */
  exception: undefined,
};

/**
 * Signifies that some erroneuous (but known/anticipated) behaviour has ocurred.
 * The difference between this and {@exception} is that this form of error is known to be possible of occuring.
 */
export type ErrorResult<E> = {
  type: typeof types.ERROR,
  /**
   * Only defined for {@link SuccessResult}
   */
  payload: undefined,
  error: E,
  /**
   * Only defined for {@link ExceptionResult}
   */
  exception: undefined
};

/**
 * Signifies that some UNEXPECTED erroneuous behaviour has occurred.
 * This result occurrs when there is a bug in the API being consumed or the consumer is consuming the API incorrectly
 * and API has not accounted for such misuse.
 */
export type ExceptionResult<T> = {
  type: typeof types.EXCEPTION;
  /**
   * Only defined for {@link SuccessResult}
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
  | SuccessResult<P>
  | ErrorResult<E>
  | ExceptionResult<EX>;

/**
 * Check if a result is an {@link ExceptionResult}.
 * @param result being checked
 * @return Returning true signifies that some unexpected (i.e. API creator did not expect/account for the errror) erroneuous behaviour has occurred.
 */
export const isException = <EX = any>(
  result: Result<unknown, unknown, EX>,
): result is ExceptionResult<EX> => result.type === types.EXCEPTION;

/**
 * Check if a result is an {@link ErrorResult}.
 * @param result being checked
 * @return Returning true signifies expected (i.e. API creator is aware of the error) erroneuous behaviour has occurred.
 */
export const isError = <E>(result: Result<unknown, E>): result is ErrorResult<E> =>
  result.type === types.ERROR;

/**
 * Check if a result is a {@link SuccessResult}.
 * @param result being checked
 * @return Returning true signifies successful/"happy path" behaviour has occurred.
 */
export const isSuccess = <P>(result: Result<P, unknown>): result is SuccessResult<P> =>
  result.type === types.SUCCESS;

/**
 * Checks if a result is a {@link FailureResult}.
 * @param result being checked
 * @returns Returning true signifies that erroneous behaviour has occurred (i.e. An {@link exception} or an {@link error}).
 */
export const isFailure = <E, EX = any>(
  result: Result<unknown, E, EX>,
): result is FailureResult<E, EX> => {
  switch (result.type) {
    case types.ERROR:
    case types.EXCEPTION: {
      return true;
    }
    default:
      return false;
  }
};

export type CreateSuccessFn = {
  <P>(payload: P): SuccessResult<P>;
  (payload?: undefined): SuccessResult<undefined>;
};
/**
 * Use this to create a {@link SuccessResult} which signifies that something successful
 * has happened and your API has run as expected and has been consumed correctly (AKA the "happy path").
 */
export const success: CreateSuccessFn = <T>(payload: T): SuccessResult<T> => ({
  type: types.SUCCESS,
  payload,
  error: undefined,
  exception: undefined,
});

export type CreateErrorFn = {
  <E>(error: E): ErrorResult<E>;
  (error?: undefined): ErrorResult<undefined>;
};
/**
 * Use this to create an {@link ErrorResult} which signifies that either your API has behaved erroneuously in some way but
 * you're aware that the error can occur.
 */
export const error: CreateErrorFn = <E>(error: E): ErrorResult<E> => ({
  type: types.ERROR,
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
    type: types.EXCEPTION,
    payload: undefined,
    error: undefined,
    exception,
  };
};

export type SimpleHandleCallback<T, V, R> = (value: V, result: T) => R;

export type SuccessCallback<T, R> = SimpleHandleCallback<SuccessResult<T>, T, R>;
export type FailureCallback<E, EX, R> = {
  (error: undefined, exception: EX, result: ExceptionResult<EX>): R;
  (error: E, exception: undefined, result: ErrorResult<E>): R;
};
export type ErrorCallback<E, R> = SimpleHandleCallback<ErrorResult<E>, E, R>;
export type ExceptionCallback<EX, R> = SimpleHandleCallback<ExceptionResult<EX>, EX, R>;

type HandleSuccessOptions<P, PR> = {
  payload: SuccessCallback<P, PR>;
};

type HandleErrorOptions<E, ER> = {
  error: ErrorCallback<E, ER>;
};

type HandleExceptionOptions<EX, EXR> = {
  exception: ExceptionCallback<EX, EXR>;
};

type HandleFailureOptions<E, EX, FR> = {
  failure: FailureCallback<E, EX, FR>;
};

export type SuccessErrorExceptionHandleOptions<P, E, EX, PR, ER, EXR> = Partial<
  HandleSuccessOptions<P, PR> &
    HandleErrorOptions<E, ER> &
    HandleExceptionOptions<EX, EXR>
> & {
  failure?: never;
};

export type SuccessFailureHandleOptions<P, E, EX, PR, FR> = Partial<
  HandleSuccessOptions<P, PR> & HandleFailureOptions<E, EX, FR>
> & {
  error?: never;
  exception?: never;
};

export type HandleOptions<P, E, EX, PR, ER, EXR, FR> =
  | SuccessErrorExceptionHandleOptions<P, E, EX, PR, ER, EXR>
  | SuccessFailureHandleOptions<P, E, EX, PR, FR>;

type AnyHandleOptions = HandleOptions<any, any, any, any, any, any, any>;
type AnyResult = Result<any, any, any>;

type NonUndefined<T> = Exclude<T, undefined>;

type ResultKeys = 'payload' | 'error' | 'exception';
type OptionKeys = ResultKeys | 'failure';

type HandledResultType<
  RType extends types.ResultType,
  OMatcher extends AnyHandleOptions,
  OKey extends OptionKeys,
  PThrough,
  R extends AnyResult,
  O extends AnyHandleOptions
> = R['type'] extends RType
  ? O extends OMatcher
    ? ReturnType<NonUndefined<O[OKey]>>
    : PThrough
  : never;

type HandledSuccessResult<
  R extends AnyResult,
  O extends AnyHandleOptions
> = HandledResultType<
  typeof types.SUCCESS,
  HandleSuccessOptions<any, any>,
  'payload',
  R,
  R,
  O
>;

type HandledExceptionResult<
  R extends AnyResult,
  O extends AnyHandleOptions
> = HandledResultType<
  typeof types.EXCEPTION,
  HandleExceptionOptions<any, any>,
  'exception',
  R,
  R,
  O
>;

type HandledErrorResult<
  R extends AnyResult,
  O extends AnyHandleOptions
> = HandledResultType<
  typeof types.ERROR,
  HandleFailureOptions<any, any, any>,
  'error',
  R,
  R,
  O
>;

type HandledFailureResultOrErrorExceptionResult<
  R extends AnyResult,
  O extends AnyHandleOptions
> = HandledResultType<
  typeof types.ERROR | typeof types.EXCEPTION,
  HandleFailureOptions<any, any, any>,
  'failure',
  HandledExceptionResult<R, O> | HandledErrorResult<R, O>,
  R,
  O
>;

export type HandledResult<R extends AnyResult, O extends AnyHandleOptions> =
  | HandledSuccessResult<R, O>
  | HandledFailureResultOrErrorExceptionResult<R, O>;

export type HandleFn = {
  <P, E, EX, R extends Result<P, E, EX>>(result: R, options?: undefined): typeof result;
  <
    P,
    E,
    EX,
    PR,
    ER,
    EXR,
    FR,
    R extends Result<P, E, EX>,
    O extends HandleOptions<P, E, EX, PR, ER, EXR, FR>
  >(
    result: R,
    options: O,
  ): HandledResult<typeof result, typeof options>;
  <P, E, EX, PR, ER, EXR, FR>(
    result: Result<P, E, EX>,
    options: HandleOptions<P, E, EX, PR, ER, EXR, FR>,
  ): typeof result | PR | ER | EXR | FR;
};

/**
 * This is exactly the same as {@link handle} except there is no try { ... } catch { ... } wrapper around the handlers.
 * This may improve performance but removes the guarentee that nothing will ever be thrown by the handle function.
 */
export const catchlessHandle: HandleFn = <P, E, EX, PR, ER, EXR, FR>(
  result: Result<P, E, EX>,
  handlers: HandleOptions<P, E, EX, PR, ER, EXR, FR> = {},
) => {
  switch (result.type) {
    case types.SUCCESS: {
      const { payload } = result;
      if (handlers.payload !== undefined) {
        return handlers.payload(payload, result);
      }
      break;
    }

    case types.ERROR: {
      const { error } = result;
      if (handlers.error !== undefined) {
        return handlers.error(error, result);
      } else if (handlers.failure !== undefined) {
        return handlers.failure(error, undefined, result);
      }
      break;
    }

    case types.EXCEPTION: {
      const { exception } = result;
      if (handlers.exception !== undefined) {
        return handlers.exception(exception, result);
      } else if (handlers.failure !== undefined) {
        return handlers.failure(undefined, exception, result);
      }
      break;
    }
  }

  return result;
};

/**
 * A helper function which executes a relevant handler based on the type of result that is passed into the function.
 * @param result The result that will be handled by one of the applicable handlers
 * @param handlers Callbacks that are used
 * @return Returns whatever is returned by the applicable handler. If no handler for the result exists, the orignal result is returned. Note that if something is thrown by one of the handlers, it is caught by this function and the value of what is caught is returned as via {@link exception}.
 */
export const handle: HandleFn = <P, E, EX, PR, ER, EXR, FR>(
  result: Result<P, E, EX>,
  handlers: HandleOptions<P, E, EX, PR, ER, EXR, FR> = {},
) => {
  try {
    return catchlessHandle(result, handlers);
  } catch (err) {
    return exception(err);
  }
};
