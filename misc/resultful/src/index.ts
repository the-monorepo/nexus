import * as types from '@resultful/symbols';
export { types };

export type AbstractResult<SymbolType, PayloadType, ErrorType, ExceptionType> = {
  type: SymbolType;
  payload: PayloadType;
  error: ErrorType;
  exception: ExceptionType;
};

export type SuccessResult<T> = {
  type: typeof types.SUCCESS;
  payload: T;
  error: undefined;
  exception: undefined;
};

export type ErrorResult<T> = {
  type: typeof types.ERROR;
  payload: undefined;
  error: T;
  exception: undefined;
};

export type ExceptionResult<T> = {
  type: typeof types.EXCEPTION;
  payload: undefined;
  error: undefined;
  exception: T;
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
  payload: undefined,
  error: error,
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

/*
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
}

type HandleErrorOptions<E, ER> = {
  error: ErrorCallback<E, ER>;
}

type HandleExceptionOptions<EX, EXR> = {
  exception: ExceptionCallback<EX, EXR>;
}

type HandleFailureOptions<E, EX, FR> ={
  failure: FailureCallback<E, EX, FR>;
}

export type SuccessErrorExceptionHandleOptions<P, PR, E, ER, EX, EXR> = 
  Partial<
    HandleSuccessOptions<P ,PR> &
    HandleErrorOptions<E, ER> &
    HandleExceptionOptions<EX, EXR>
  > & {
    failure?: never,
  };

export type SuccessFailureHandleOptions<P, PR, E, EX, FR> = 
  Partial<
    HandleSuccessOptions<P ,PR> &
    HandleFailureOptions<E, EX, FR>
  > & {
    error?: never;
    exception?: never;
  };

export type HandleOptions<P, PR, E, ER, EX, EXR, FR> =
  | SuccessErrorExceptionHandleOptions<P, PR, E, ER, EX, EXR>
  | SuccessFailureHandleOptions<P, PR, E, EX, FR>;

type AnyHandleOptions = HandleOptions<any, any, any, any, any, any, any>;
type AnyResult = Result<any, any, any>;

type NonUndefined<T> = Exclude<T, undefined>;

type ResultKeys = 'payload' | 'error' | 'exception';
type OptionKeys = ResultKeys | 'failure';

type HandledResultType<ResultSymbol extends types.Symbols, ResultKey extends ResultKeys, OptionKey extends OptionKeys, Options extends AnyHandleOptions, OriginalResult extends AnyResult> =
  ResultSymbol extends OriginalResult['type'] ? (Options[OptionKey] extends undefined ? OriginalResult[ResultKey] : ReturnType<NonUndefined<Options[OptionKey]>>) : never;

type Test<T> = T extends undefined ? 'yep' : 'nope';
type Test2= Test<'???'>;
type Test3= Test<undefined>;
type Test4= Test<undefined | 'rawr'>;

export type HandledResult<OriginalResult extends AnyResult, Options extends AnyHandleOptions> = 
typeof types.SUCCESS extends OriginalResult['type'] ? (Options['payload'] extends undefined ? OriginalResult['payload'] : ReturnType<NonUndefined<Options['payload']>>) : never;

type PassThroughResult = {
  payload: <T>(a: T) => T,
  error: <T>(a: T) => T,
  exception: <T>(a: T) => T
};

type Handle = {
  <
    R extends Result<infer P, infer E, infer EX>,
    O extends HandleOptions<infer P, infer PR, infer E, infer ER, infer EX, infer EXR, infer FR>
  >(
    result: R,
    options: O
  ): R['type'] extends typeof types.SUCCESS ? O['payload'] extends undefined ? PR : ReturnType<O['payload']> : never;
}

export const handle: Handle = (
  result: SuccessResult<P>,
  // TODO: Remove type assertion
  options: O = ({} as any),
): => {
  switch (result.type) {
    case types.SUCCESS: {
      const { payload } = result;
      if (options.payload === undefined) {
        return result.payload;
      } else {
        return options.payload(payload, result);
      }
    }
  }
  throw new Error();
};

const a = handle(error('a' as 'a'), {
  payload: () => {}
});
*/
