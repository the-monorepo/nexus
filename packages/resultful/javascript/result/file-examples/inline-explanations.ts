import { ok, failure, isOk, isFailure, map } from '@resultful/result';

// There are 2 types of 'results' you can create:
const payloadResult = ok('put whatever you want in here'); // Aliases for resultful.ok include: resultful.ok resultful.normal
const failureResult = failure({
  message: 'Really, whatever you want',
});
console.log(payloadResult.ok, failureResult.failure);

// You can then use any of the following to differentiate between failure types:
// Prints: true false false
console.log(isOk(payloadResult), isFailure(failureResult)); // Aliases for resultful.hasSuccess include: resultful.isPayload resultful.isNormal
// Prints: false true false
console.log(isOk(payloadResult), isFailure(failureResult));

// You can also handle results via handle:
/*
 * Note: Even though you can technically return anything,
 * in most cases it's recommended you return a resultful object.
 * That way you can chain resultful.handle calls if you need to
 */
const handlers = {
  ok: (payload, result) => payload === payloadResult.ok && result === payloadResult,
  failure: (failure, result) =>
    failure === payloadResult.failure && result === failureResult,
};
// Prints: true
console.log(map(payloadResult, handlers));
// Prints: true
console.log(map(failureResult, handlers));

// If no handler is provided for a particular result, the result the original result gets returned
// Prints: true
console.log(map(payloadResult, {}) === payloadResult);
