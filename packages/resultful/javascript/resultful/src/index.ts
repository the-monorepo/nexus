import {
	type Failure,
	error,
	isError,
	isUnknown,
	transform as transformFailure,
	unknown,
} from "@resultful/failure";
import {
	type Result,
	failure,
	isFailure,
	isOk,
	ok,
	transform as transformResult,
} from "@resultful/result";
import type { TypedObjectSchema } from "@resultful/utility-types";

export { ok, isOk, error, unknown, failure };

export const unknownFailure = (value: unknown) => failure(unknown(value));
export const errorFailure = <E>(value: E) => failure(error(value));

export const isUnknownFailure = <R extends TypedObjectSchema>(value: R) =>
	isFailure(value) && isUnknown(value.failure);

export const isErrorFailure = <R extends TypedObjectSchema>(value: R) =>
	isFailure(value) && isError(value.failure);

export const transform = <R extends Result<any, Failure<any>>>(
	result: R,
	{ ok, error, unknown },
) =>
	transformResult(result, {
		ok,
		failure: (failureValue) =>
			transformFailure(failureValue, {
				error: (errorValue) => error(errorValue, failureValue, result),
				unknown: (unknownValue) => unknown(unknownValue, failureValue, result),
			}),
	});
