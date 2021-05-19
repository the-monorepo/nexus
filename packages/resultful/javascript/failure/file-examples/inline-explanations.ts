import {
  hasError,
  hasException,
  hasUnknown,
  createError,
  createException,
  createUnknown,
} from '@resultful/failure';

// There are 3 types of 'results' you can create:
const successResult = resultful.createPayload('put whatever you want in here'); // Aliases for resultful.createPayload include: resultful.payload resultful.normal
const errorResult = resultful.createErrorFailure({
  message: 'Really, whatever you want',
});
const exceptionResult = resultful.createUnknownFailure(
  new Error('Exceptions are recommended to be or at least contain an error'),
);
console.log(successResult.payload, errorResult.error, exceptionResult.exception);

// You can then use any of the following to differentiate between error types:
// Prints: true false false
console.log(
  resultful.hasSuccess(successResult),
  resultful.hasSuccess(errorResult),
  resultful.hasSuccess(exceptionResult),
); // Aliases for resultful.hasSuccess include: resultful.isPayload resultful.isNormal
// Prints: false true false
console.log(
  resultful.hasErrorFailure(successResult),
  resultful.hasErrorFailure(errorResult),
  resultful.hasErrorFailure(exceptionResult),
);
// Prints: false false true
console.log(
  resultful.hasUnknownFailure(successResult),
  resultful.hasUnknownFailure(errorResult),
  resultful.hasUnknownFailure(exceptionResult),
);
// Prints: false true true
console.log(
  resultful.isFailure(successResult),
  resultful.isFailure(errorResult),
  resultful.isFailure(exceptionResult),
);

// You can also handle results via handle:
/*
 * Note: Even though you can technically return anything,
 * in most cases it's recommended you return a resultful object.
 * That way you can chain resultful.handle calls if you need to
 */
const handlers = {
  payload: (payload, result) =>
    payload === successResult.payload && result === successResult,
  error: (error, result) => error === errorResult.error && result === errorResult,
  exception: (exception, result) =>
    exception === exceptionResult.exception && result === exceptionResult,
};
// Prints: true
console.log(resultful.handle(successResult, handlers));
// Prints: true
console.log(resultful.handle(errorResult, handlers));
// Prints: true
console.log(resultful.handle(exceptionResult, handlers));

// If no handler is provided for a particular result, the result the original result gets returned
// Prints: true
console.log(resultful.handle(successResult, {}) === successResult);

// Throwing an error in a handle without catching it will automatically catch the error and put it in an exception(...);
console.log(
  resultful.handle(successResult, {
    payload: () => {
      throw new Error('This will be put in an exception result');
    },
  }),
);
