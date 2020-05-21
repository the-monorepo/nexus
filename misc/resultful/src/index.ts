export type SuccessResult<T> = {
  payload: T;
  error: undefined;
  exception: undefined;
};

export type ErrorResult<E> = {
  payload: undefined;
  error: E;
  exception: undefined;
};

export type ExceptionResult<EX = any | Error> = {
  payload: undefined;
  error: undefined;
  exception: EX;
};

export type FailureResult<E, EX = any | Error> = ErrorResult<E> | ExceptionResult<EX>;

export type Result<T, E, EX = any | Error> =
  | SuccessResult<T>
  | ErrorResult<E>
  | ExceptionResult<EX>;

export const isException = <EX = any | Error>(
  result: Result<unknown, unknown, EX>,
): result is ExceptionResult<EX> => result.exception !== undefined;

export const isError = <E>(result: Result<unknown, E>): result is ErrorResult<E> =>
  result.error !== undefined;

export const isSuccessful = <P>(result: Result<P, unknown>): result is SuccessResult<P> =>
  result.payload !== undefined;

export const isFailure = <E, EX = any | Error>(
  result: Result<unknown, E, EX>,
): result is FailureResult<E, EX> => result.payload === undefined;

export const error = <E>(error: E): ErrorResult<E> => ({
  error,
  payload: undefined,
  exception: undefined,
});

export const success = <T>(payload: T): SuccessResult<T> => ({
  payload,
  error: undefined,
  exception: undefined,
});

export const exception = <E extends Error = Error>(exception: E): ExceptionResult<E> => {
  return {
    payload: undefined,
    error: undefined,
    exception,
  };
};
