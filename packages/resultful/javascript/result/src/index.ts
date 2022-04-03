import { OK, FAILURE } from '@resultful/result-types';
import type { ResultType } from '@resultful/result-types';
import {
  TransformTypedObject,
  Include,
  TypeHolder,
  TypedResultfulSchema,
  TypedObjectSchema,
  TransformOptionsSchema,
  ResultTransformer,
  OptionIfTypeElseEmpty,
} from '@resultful/utility-types';
export { OK, FAILURE } from '@resultful/result-types';
export type { ResultType };
export type { OptionIfTypeElseEmpty };

/**
 * Signifies that something 'worked'. Also known as a "happy path" result.
 */
export type OkResult<OkType> = {
  type: typeof OK;
  ok: OkType;
  /**
   * Only defined for {@link FailureResult}
   */
  failure: undefined;
};

/**
 * Signifies that some erroneuous (but known/anticipated) behaviour has ocurred.
 * The difference between this and {@exception} is that this form of failure is known to be possible of occuring.
 */
export type FailureResult<FailureType> = {
  type: typeof FAILURE;
  /**
   * Only defined for {@link OkResult}
   */
  ok: undefined;
  failure: FailureType;
};

export type Result<OkType, FailureType> =
  | OkResult<OkType>
  | FailureResult<FailureType>;

/**
 * Check if a result is a {@link FailureResult}.
 * @param result being checked
 * @return Returning true signifies (i.e. API creator is aware of the failure) some failure-type behaviour has occurred.
 */
export const isFailure = <R extends TypedObjectSchema>(
  result: R,
): result is Include<R, TypeHolder<typeof FAILURE>> => result.type === FAILURE;

/**
 * Check if a result is a {@link OkResult}.
 * @param result being checked
 * @return Returning true signifies successful/"happy path" behaviour has occurred.
 */
export const isOk = <R extends TypedObjectSchema>(
  result: R,
): result is Include<R, TypeHolder<typeof OK>> => result.type === OK;

export type CreateOkFn = {
  <P>(ok: P): OkResult<P>;
  (ok?: undefined): OkResult<undefined>;
};

/**
 * Use this to create a {@link OkResult} which signifies that something successful
 * has happened and your API has run as expected and has been consumed correctly (AKA the "happy path").
 */
export const ok: CreateOkFn = <P>(ok: P): OkResult<P> => ({
  type: OK,
  ok,
  failure: undefined,
});

export type CreateFailureFn = {
  <E>(failure: E): FailureResult<E>;
  (failure?: undefined): FailureResult<undefined>;
};
/**
 * Use this to create an {@link FailureResult} which signifies that either your API has behaved erroneuously in some way but
 * you're aware that the failure can occur.
 */
export const failure: CreateFailureFn = <E>(failure: E): FailureResult<E> => ({
  type: FAILURE,
  ok: undefined,
  failure: failure,
});

export type OkHandler<T, R> = ResultTransformer<OkResult<T>, T, R>;
export type FailureHandler<E, R> = ResultTransformer<FailureResult<E>, E, R>;

export type HandleOkOptions<P, PR> = {
  ok: OkHandler<P, PR>;
};

export type HandleFailureOptions<E, ER> = {
  failure: FailureHandler<E, ER>;
};

export type FullHandleOptions<P, E, PR, ER> = HandleOkOptions<P, PR> &
  HandleFailureOptions<E, ER>;

export type HandleOptions<P, E, PR, ER> = Partial<FullHandleOptions<P, E, PR, ER>>;

export type FullOptionsBasedOnResult<R extends TypedResultfulSchema, PR, FR> =
  OptionIfTypeElseEmpty<R, typeof OK, 'ok', PR> &
    OptionIfTypeElseEmpty<R, typeof FAILURE, 'failure', FR>;

export type OptionsBasedOnResult<R extends TypedResultfulSchema, PR, ER> = Partial<
  FullOptionsBasedOnResult<R, PR, ER>
>;

export type HandledOkResult<
  R extends TypedObjectSchema,
  O extends TransformOptionsSchema,
> = TransformTypedObject<R, O, 'ok', typeof OK>;

export type HandledFailureResult<
  R extends TypedObjectSchema,
  O extends TransformOptionsSchema,
> = TransformTypedObject<R, O, 'failure', typeof FAILURE>;

export type HandledResult<R extends TypedObjectSchema, O extends TransformOptionsSchema> =
  HandledOkResult<R, O> | HandledFailureResult<R, O>;

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
export const map: TransformFn = <P, E, PR, ER>(
  result: Result<P, E>,
  handlers: HandleOptions<P, E, PR, ER> = {},
) => {
  switch (result.type) {
    case OK: {
      const { ok } = result;
      if (handlers.ok !== undefined) {
        return handlers.ok(ok, result);
      }
      break;
    }

    case FAILURE: {
      const { failure } = result;
      if (handlers.failure !== undefined) {
        return handlers.failure(failure, result);
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

export type ValueOf<R extends TypedResultfulSchema> = R extends OkResult<infer P>
  ? P
  : R extends FailureResult<infer E>
  ? E
  : never;
export type ValueOfFn = <R extends Result<any, any>>(result: R) => ValueOf<R>;
export const valueOf: ValueOfFn = <P, E>(result: Result<P, E>): P | E => {
  return map(result, {
    ok: (ok) => ok,
    failure: (failure) => failure,
  });
};
