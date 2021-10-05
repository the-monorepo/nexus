import * as ResultTypes from './types.ts';
import { PAYLOAD, FAILURE } from './types.ts';
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
export { ResultTypes };
export type { OptionIfTypeElseEmpty };

/**
 * Signifies that something 'worked'. Also known as a "happy path" result.
 */
export type PayloadResult<PayloadType> = {
  type: typeof PAYLOAD;
  payload: PayloadType;
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
   * Only defined for {@link PayloadResult}
   */
  payload: undefined;
  failure: FailureType;
};

export type Result<PayloadType, FailureType> =
  | PayloadResult<PayloadType>
  | FailureResult<FailureType>;

/**
 * Check if a result is a {@link FailureResult}.
 * @param result being checked
 * @return Returning true signifies (i.e. API creator is aware of the failure) some failure-type behaviour has occurred.
 */
export const hasFailure = <R extends TypedObjectSchema>(
  result: R,
): result is Include<R, TypeHolder<typeof FAILURE>> => result.type === FAILURE;

/**
 * Check if a result is a {@link PayloadResult}.
 * @param result being checked
 * @return Returning true signifies successful/"happy path" behaviour has occurred.
 */
export const hasPayload = <R extends TypedObjectSchema>(
  result: R,
): result is Include<R, TypeHolder<typeof PAYLOAD>> => result.type === PAYLOAD;

export type CreatePayloadFn = {
  <P>(payload: P): PayloadResult<P>;
  (payload?: undefined): PayloadResult<undefined>;
};

/**
 * Use this to create a {@link PayloadResult} which signifies that something successful
 * has happened and your API has run as expected and has been consumed correctly (AKA the "happy path").
 */
export const payload: CreatePayloadFn = <P>(payload: P): PayloadResult<P> => ({
  type: PAYLOAD,
  payload,
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
  payload: undefined,
  failure: failure,
});

export type PayloadHandler<T, R> = ResultTransformer<PayloadResult<T>, T, R>;
export type FailureHandler<E, R> = ResultTransformer<FailureResult<E>, E, R>;

export type HandlePayloadOptions<P, PR> = {
  payload: PayloadHandler<P, PR>;
};

export type HandleFailureOptions<E, ER> = {
  failure: FailureHandler<E, ER>;
};

export type FullHandleOptions<P, E, PR, ER> = HandlePayloadOptions<P, PR> &
  HandleFailureOptions<E, ER>;

export type HandleOptions<P, E, PR, ER> = Partial<FullHandleOptions<P, E, PR, ER>>;

export type FullOptionsBasedOnResult<R extends TypedResultfulSchema, PR, FR> =
  OptionIfTypeElseEmpty<R, typeof PAYLOAD, 'payload', PR> &
    OptionIfTypeElseEmpty<R, typeof FAILURE, 'failure', FR>;

export type OptionsBasedOnResult<R extends TypedResultfulSchema, PR, ER> = Partial<
  FullOptionsBasedOnResult<R, PR, ER>
>;

export type HandledPayloadResult<
  R extends TypedObjectSchema,
  O extends TransformOptionsSchema,
> = TransformTypedObject<R, O, 'payload', typeof PAYLOAD>;

export type HandledFailureResult<
  R extends TypedObjectSchema,
  O extends TransformOptionsSchema,
> = TransformTypedObject<R, O, 'failure', typeof FAILURE>;

export type HandledResult<R extends TypedObjectSchema, O extends TransformOptionsSchema> =
  HandledPayloadResult<R, O> | HandledFailureResult<R, O>;

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
export const transform: TransformFn = <P, E, PR, ER>(
  result: Result<P, E>,
  handlers: HandleOptions<P, E, PR, ER> = {},
) => {
  switch (result.type) {
    case PAYLOAD: {
      const { payload } = result;
      if (handlers.payload !== undefined) {
        return handlers.payload(payload, result);
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

export type ValueOf<R extends TypedResultfulSchema> = R extends PayloadResult<infer P>
  ? P
  : R extends FailureResult<infer E>
  ? E
  : never;
export type ValueOfFn = <R extends Result<any, any>>(result: R) => ValueOf<R>;
export const valueOf: ValueOfFn = <P, E>(result: Result<P, E>): P | E => {
  return transform(result, {
    payload: (payload) => payload,
    failure: (failure) => failure,
  });
};
