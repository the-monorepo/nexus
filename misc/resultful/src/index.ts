import * as keys from './keys';
import * as types from './types';
export { types, keys };

export type SuccessResult<T> = {
  type: typeof types.SUCCESS;
  [keys.SUCCESS]: T;
  [keys.ERROR]: undefined;
  [keys.EXCEPTION]: undefined;
};

export type ErrorResult<E> = {
  type: typeof types.ERROR;
  [keys.SUCCESS]: undefined;
  [keys.ERROR]: E;
  [keys.EXCEPTION]: undefined;
};

export type ExceptionResult<EX = any | Error> = {
  type: typeof types.EXCEPTION;
  [keys.SUCCESS]: undefined;
  [keys.ERROR]: undefined;
  [keys.EXCEPTION]: EX;
};

export type FailureResult<E, EX = any | Error> = ErrorResult<E> | ExceptionResult<EX>;

export type Result<T, E, EX = any | Error> =
  | SuccessResult<T>
  | ErrorResult<E>
  | ExceptionResult<EX>;

export const isException = <EX = any | Error>(
  result: Result<unknown, unknown, EX>,
): result is ExceptionResult<EX> => result.type === types.EXCEPTION;

export const isError = <E>(result: Result<unknown, E>): result is ErrorResult<E> =>
  result.type === types.ERROR;

export const isSuccess = <P>(result: Result<P, unknown>): result is SuccessResult<P> =>
  result.type === types.SUCCESS;

export const isFailure = <E, EX = any | Error>(
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

/**
 * Creates an "error" result - Return this if an error has ocurred
 */
export const error = <E>(error: E): ErrorResult<E> => ({
  type: types.ERROR,
  error,
  payload: undefined,
  exception: undefined,
});

export const success = <T>(payload: T): SuccessResult<T> => ({
  type: types.SUCCESS,
  payload,
  error: undefined,
  exception: undefined,
});

/**
 * Creates an "exception" result - Return this result if some unexpected,
 * thought-to-be-impossible/didn't-think-about-it type erroneous behaviour has ocurred
 */
export const exception = <EX>(exception: EX): ExceptionResult<EX> => {
  return {
    type: types.EXCEPTION,
    payload: undefined,
    error: undefined,
    exception,
  };
};

export type SimpleHandleCallback<T, R> = (value: T) => R;

export type SuccessCallback<T, R> = SimpleHandleCallback<T, R>;
export type FailureCallback<E, EX, R> = {
  (error: undefined, exception: EX): R;
  (error: E, exception: undefined): R;
};
export type ErrorCallback<E, R> = (error: E) => R;
export type ExceptionCallback<EX, R> = (exception: EX) => R;

export type SuccessOnlyHandleOptions<P, R> = {
  payload: SuccessCallback<P, R>;
};

export type ErrorOnlyHandleOptions<E, R> = {
  error: ErrorCallback<E, R>;
};

export type ExceptionOnlyHandleOptions<EX, R> = {
  exception: ExceptionCallback<EX, R>;
};

export type FailureOnlyHandleOptions<E, EX, R> = {
  failure: FailureCallback<E, EX, R>;
};

export type SuccessErrorExceptionHandleOptions<P, PR, E, ER, EX, EXR> = {
  payload?: SuccessCallback<P, PR>;
  error?: ErrorCallback<E, ER>;
  exception?: ExceptionCallback<EX, EXR>;
  failure?: never;
};

export type SuccessFailureHandleOptions<P, PR, E, EX, FR> = {
  payload?: SuccessCallback<P, PR>;
  error?: never;
  exception?: never;
  failure?: FailureCallback<E, EX, FR>;
};

export type HandleOptions<P, PR, E, ER, EX, EXR, FR> =
  | SuccessErrorExceptionHandleOptions<P, PR, E, ER, EX, EXR>
  | SuccessFailureHandleOptions<P, PR, E, EX, FR>;

export const handle = <P, PR, E, ER, EX, EXR, FR>(
  result: Result<P, E, EX>,
  options: HandleOptions<P, PR, E, ER, EX, EXR, FR>,
) => {
  switch (result.type) {
    case types.SUCCESS: {
      if (options.payload !== undefined) {
        return options.payload(result.payload);
      }
      break;
    }
    case types.ERROR: {
      if (options.error !== undefined) {
        return options.error(result.error);
      } else if (options.failure !== undefined) {
        return options.failure(result.error, undefined);
      }
      break;
    }
    case types.EXCEPTION: {
      if (options.exception !== undefined) {
        return options.exception(result.exception);
      } else if (options.failure !== undefined) {
        return options.failure(undefined, result.exception);
      }
    }
  }

  return result;
};
