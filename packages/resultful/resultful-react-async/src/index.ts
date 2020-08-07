import { Dispatch, SetStateAction, useMemo, useState } from 'react';

import * as resultful from 'resultful';

import * as PayloadTypes from '@resultful/react-async-payload-types';

export * from 'resultful';

export { PayloadTypes };

export type ResolvedPayload<R> = {
  type: typeof PayloadTypes.RESOLVED;
  resolved: R;
  pending: undefined;
};

export type PendingPayload<P> = {
  type: typeof PayloadTypes.PENDING;
  resolved: undefined;
  pending: P;
};

export type ResolvedResult<R> = resultful.SuccessResult<ResolvedPayload<R>>;

export type PendingResult<P> = resultful.SuccessResult<PendingPayload<P>>;

export type AsyncPayload<R, P> = ResolvedPayload<R> | PendingPayload<P>;

export type AsyncResult<R, P, E, EX> = resultful.Result<AsyncPayload<R, P>, E, EX>;

export type ResolvedPayloadFn = {
  <R>(resolved: R): ResolvedPayload<R>;
  (resolved?: undefined): ResolvedPayload<undefined>;
};
export const resolvedPayload: ResolvedPayloadFn = <R>(resolved: R): ResolvedPayload<R> => ({
  type: PayloadTypes.RESOLVED,
  resolved,
  pending: undefined,
});

export type ResolvedFn = {
  <R>(resolved: R): ResolvedResult<R>;
  (resolved?: undefined): ResolvedResult<undefined>;
};
export const resolved: ResolvedFn = <R>(resolved: R): ResolvedResult<R> => resultful.success(resolvedPayload(resolved));

export const isResolvedPayload = <P extends PayloadSchema>(payload: P): payload is resultful.Include<P, resultful.TypeHolder<typeof PayloadTypes.RESOLVED>> => payload.type === PayloadTypes.RESOLVED;

export type PendingPayloadFn = {
  <P>(resolved: P): PendingPayload<P>;
  (resolved?: undefined): PendingPayload<undefined>;
};
export const pendingPayload: PendingPayloadFn = <P>(pending: P): PendingPayload<P> => ({
  type: PayloadTypes.PENDING,
  resolved: undefined,
  pending,
});

export type PendingFn = {
  <P>(resolved: P): PendingResult<P>;
  (resolved?: undefined): PendingResult<undefined>;
};

export type PayloadSchema = resultful.TypedObjectSchema;

export const pending: PendingFn = <P>(pending: P): PendingResult<P> => resultful.success(pendingPayload(pending));

export const isPendingPayload = <P extends PayloadSchema>(payload: P): payload is resultful.Include<P, resultful.TypeHolder<typeof PayloadTypes.PENDING>> => payload.type === PayloadTypes.PENDING;

export type Setters<R, P, E, EX> = {
  resolved: (resolved: R) => void;
  pending: (loading: P) => void;
  error: (error: E) => void;
  exception: (exception: EX) => void;
};

export const useAsyncState = <R, P, E, EX>(initialState: P): [AsyncResult<R, P, E, EX>, Setters<R, P, E, EX>] => {
  const [state, setState] = useState<AsyncResult<R, P, E, EX>>(pending(initialState));

  const setters: Setters<R, P, E, EX> = useMemo(() => ({
    resolved: (value: R) => setState(resolved(value)),
    pending: (value: P) => setState(pending(value)),
    error: (value: E) => setState(resultful.error(value)),
    exception: (value: EX) => setState(resultful.exception(value)),
  }), [setState]);

  return [state, setters];
};

export type SimpleHandlePayloadCallback<T, V, R> = (value: V, payload: T) => R;
export type HandleResolvedPayloadCallback<V, R> = SimpleHandlePayloadCallback<ResolvedPayload<V>, V, R>;
export type HandlePendingPayloadCallback<V, R> = SimpleHandlePayloadCallback<PendingPayload<V>, V, R>;

export type HandleResolvedPayloadOptions<R, RR> = {
  resolved: HandleResolvedPayloadCallback<R, RR>;
};
export type HandlePendingPayloadOptions<P, PR> = {
  pending: HandlePendingPayloadCallback<P, PR>;
};
export type HandlePayloadOptions<P, R, PR, RR> = 
  HandleResolvedPayloadOptions<P, PR> & 
  HandlePendingPayloadOptions<R, RR>;

export const catchlessHandlePayload = <R, P, RR, PR>(payload: AsyncPayload<R, P>, handlers): AsyncPayload<R, P> | RR | PR => {
  switch(payload.type) {
    case PayloadTypes.PENDING:
      if (handlers.pending !== undefined) {
        return handlers.pending(payload.pending, payload);
      };
      break;
    case PayloadTypes.RESOLVED:
      if (handlers.resolved !== undefined) {
        return handlers.resolved(payload.resolved, payload);
      }
      break;
  }
  
  return payload;
};

export const catchlessHandle = <R, P, E, EX>(result: AsyncResult<R, P, E, EX>, handlers) => {
  return resultful.catchlessHandle(result, {
    payload: (payload, result) => {
      return catchlessHandlePayload(payload, {
        resolved: (value) => handlers.resolved(value, result),
        pending: (value) => handlers.pending(value, result),
      });
    },
    error: handlers.error,
    exception: handlers.exception,
  });
};