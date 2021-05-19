import {
  createFailure,
  createPayload,
  hasFailure,
  hasPayload,
  Result,
  transform as transformResult,
} from '@resultful/result';
import {
  createError,
  createUnknown,
  Failure,
  hasError,
  hasUnknown,
  transform as transformFailure,
} from '@resultful/failure';
import {
  TypedObjectSchema,
} from '@resultful/utility-types';

export { createPayload, hasPayload };

export const createUnknownFailure = (value: unknown) => createFailure(createUnknown(value));
export const createErrorFailure = <E>(value: E) => createFailure(createError(value));

export const hasUnknownFailure = <R extends TypedObjectSchema>(value: R) => hasFailure(value) && hasUnknown(value);

export const hasErrorFailure = <R extends TypedObjectSchema>(value: R) => hasFailure(value) && hasError(value);

export const transform = <R extends Result<any, Failure<any>>>(result: R, { payload, error, unknown }) => transformResult(result, {
  payload,
  failure: (failureValue) => transformFailure(failureValue, {
    error: (errorValue) => error(errorValue, failureValue, result),
    unknown: (unknownValue) => unknown(unknownValue, failureValue, result),
  }),
});
