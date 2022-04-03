# Result

A utility package for avoiding throw, try and catch. Return exceptions, failures and successful results.

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
  ok,
  failure,
  isOk,
  isFailure,
  transform,
} from '@resultful/result';

// There are 2 types of 'results' you can create:
const okResult = ok('put whatever you want in here'); // Aliases for resultful.ok include: resultful.ok resultful.normal
const failureResult = failure({
  message: 'Really, whatever you want',
});
console.log(okResult.ok, failureResult.failure);

// You can then use any of the following to differentiate between failure types:
// Prints: true false false
console.log(isOk(okResult), isFailure(failureResult)); // Aliases for resultful.hasSuccess include: resultful.isPayload resultful.isNormal
// Prints: false true false
console.log(isOk(okResult), isFailure(failureResult));

// You can also handle results via handle:
/*
 * Note: Even though you can technically return anything,
 * in most cases it's recommended you return a resultful object.
 * That way you can chain resultful.handle calls if you need to
 */
const handlers = {
  ok: (ok, result) =>
    ok === okResult.ok && result === okResult,
  failure: (failure, result) =>
    failure === okResult.failure && result === failureResult,
};
// Prints: true
console.log(map(okResult, handlers));
// Prints: true
console.log(map(failureResult, handlers));

// If no handler is provided for a particular result, the result the original result gets returned
// Prints: true
console.log(map(okResult, {}) === okResult);
```

---
This documentation was generated using [writeme](https://www.npmjs.com/package/@writeme/core)
