# Result

A utility package for avoiding throw, try and catch. Return exceptions, errors and successful results.

## Installation

```bash
npm install --save @resultful/result
```
or
```bash
yarn add @resultful/result
```

## How to use it

```typescript
import {
  createPayload,
  createFailure,
  hasPayload,
  hasFailure,
  transform,
} from '@resultful/result';

// There are 2 types of 'results' you can create:
const payloadResult = createPayload('put whatever you want in here'); // Aliases for resultful.success include: resultful.payload resultful.normal
const errorResult = createFailure({
  message: 'Really, whatever you want',
});
console.log(payloadResult.payload, errorResult.failure);

// You can then use any of the following to differentiate between error types:
// Prints: true false false
console.log(
  hasPayload(payloadResult),
  hasFailure(errorResult),
); // Aliases for resultful.isSuccess include: resultful.isPayload resultful.isNormal
// Prints: false true false
console.log(
  hasPayload(payloadResult),
  hasFailure(errorResult),
);

// You can also handle results via handle:
/*
 * Note: Even though you can technically return anything,
 * in most cases it's recommended you return a resultful object.
 * That way you can chain resultful.handle calls if you need to
 */
const handlers = {
  payload: (payload, result) =>
    payload === payloadResult.payload && result === payloadResult,
  failure: (failure, result) => failure === payloadResult.failure && result === errorResult,
};
// Prints: true
console.log(transform(payloadResult, handlers));
// Prints: true
console.log(transform(errorResult, handlers));

// If no handler is provided for a particular result, the result the original result gets returned
// Prints: true
console.log(transform(payloadResult, {}) === payloadResult);
```

---
This documentation was generated using [writeme](https://www.npmjs.com/package/@writeme/core)
