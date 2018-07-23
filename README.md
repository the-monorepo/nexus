# jest-mock-functions
Mocks all functions inside an array or object literal.
**Note**: This package is specifically meant for use with [Jest](https://jestjs.io/)

## Installation
`npm install jest-mock-functions`
or
`yarn add --dev jest-mock-functions`

## How to use it
### Objects
You can mock objects:
```js
import { mockFunctions } from 'jest-mock-functions';
const mockedObject = mockFunctions({
  aInteger: 1,
  // This is replaced with jest.fn()
  aFunction: () => {},
  // This is replaced with jest.fn()
  anotherFunction: function() {}
});
```

### Array
You can mock arrays:
```js
import { mockFunctions } from 'jest-mock-functions';
// Will return [1, jest.fn(), jest.fn()];
const mockedArray = mockFunctions([
  1,
  () => {},
  function() {},
]);
```

### Recursively mock functions
You can mock functions inside arrays inside objects. With `{ recursive: true }`.
```js
import { mockFunctions } from 'jest-mock-functions';
// Will return { test: [ jest.fn(), 1] }
const mockedThing = mockFunctions({
  test: [() => {}, 1]
}, { recursive: true });
```

Or the other way around.
```js
import { mockFunctions } from 'jest-mock-functions';
// Will return [ { test: jest.fn() }, { aInt: 1 }]
const mockedThing = mockFunctions(
  [ { test: () => {} }, { aInt: 1 }],
  { recursive: true }
);
```

Go crazy with it.
```js
import { mockFunctions } from 'jest-mock-functions';
// Will return [[{ this: { is: [{ rediculous: jest.fn() }]}}]]
const mockedThing = mockFunctions(
  [[{ this: { is: [{ rediculous: () => {}}]}}]],
  { recursive: true }
);
```