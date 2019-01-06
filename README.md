# jest-mock-functions

[![npm version](https://badge.fury.io/js/jest-mock-functions.svg)](https://badge.fury.io/js/jest-mock-functions) 
[![Build Status](https://travis-ci.com/PatrickShaw/jest-mock-functions.svg?branch=master)](https://travis-ci.com/PatrickShaw/jest-mock-functions) 
[![codecov](https://codecov.io/gh/PatrickShaw/jest-mock-functions/branch/master/graph/badge.svg)](https://codecov.io/gh/PatrickShaw/jest-mock-functions) 
[![Greenkeeper badge](https://badges.greenkeeper.io/PatrickShaw/jest-mock-functions.svg)](https://greenkeeper.io/)

Ever needed to mock all the functions of an object but nothing else?

This package mocks all functions inside a arrays, objects, Maps, Sets and class instances and copys overs everything else into a new object.

**Note**: This package is specifically meant for use with [Jest](https://jestjs.io/)

## Installation
`npm install jest-mock-functions`
or
`yarn add --dev jest-mock-functions`


## How to use it
### Objects
You can mock objects:
```js
import mockFunctions from 'jest-mock-functions';
const mockedObject = mockFunctions({
  aInteger: 1,
  // This is replaced with jest.fn()
  aFunction: () => {},
  // This is replaced with jest.fn()
  anotherFunction: function() {}
});
```

### Arrays
You can mock the contents of arrays:
```js
import mockFunctions from 'jest-mock-functions';
// Will return [1, jest.fn(), jest.fn()];
const mockedArray = mockFunctions([
  1,
  () => {},
  function() {},
]);
```

### Sets



### Class instances
Mocking an instance of class will add mocked functions for all the instance's functions and all of it's prototype's functions.
```js
class Example {
  constructor() { 
    this.aFunction = () => { return 1; }
  } 
  anotherFuntion() {
    return 2;
  }
}

const mocked = mockFunctions(new Example());
// Has been mocked
mocked.aFunction();
// Has been mocked
mocked.anotherFunction();

const notMocked = new Example();
// Returns 1
notMocked.aFunction();
// Returns 2
notMocked.anotherFunction();
```

### Options
You can pass options into `mockFunctions`.
E.g. `mockFunctions(aValue, { recursive: true })`

#### recursive: boolean | RecursionOptions

You can mock functions inside arrays inside objects. With `{ recursive: true }`.
```js
import mockFunctions from 'jest-mock-functions';
// Will return { test: [ jest.fn(), 1] }
const mockedThing = mockFunctions({
  test: [() => {}, 1]
}, { recursive: true });
```

or the other way around
```js
import mockFunctions from 'jest-mock-functions';
// Will return [ { test: jest.fn() }, { aInt: 1 }]
const mockedThing = mockFunctions(
  [ { test: () => {} }, { aInt: 1 }],
  { recursive: true }
);
```

go crazy with it
```js
import mockFunctions from 'jest-mock-functions';
// Will return [[{ this: { is: [{ rediculous: jest.fn() }]}}]]
const mockedThing = mockFunctions(
  [[{ this: { is: [{ rediculous: () => {}}]}}]],
  { recursive: true }
);
```

##### Class instances
By default, class instances are not mocked recursively. If you wish to mock class instances add the option: `{ recursive: { classInstances: true } }`.


#### onMockedFunction: (mockedFunction, originalValue) => any

Use this if you want to do something with the mocked functions. 
E.g. Return a specific value:
```js
import mockFunctions from 'jest-mock-functions';
const mockedObject = mockFunctions({
  test: () => 2,
  test2: () => 3
}, { onMockedFunction: (fn, ogVal) => fn.mockImplementation(() => ogVal * 2 });
// Returns 4
mockedObject.test();
// Returns 6
mockedObject.test2();
```
