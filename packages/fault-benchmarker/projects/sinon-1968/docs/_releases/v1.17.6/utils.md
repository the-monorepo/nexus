---
layout: page
title: Utilities - Sinon.JS
breadcrumb: utilities
---

Sinon.JS has a few utilities used internally in `lib/sinon.js`. Unless the method in question is documented here, it should not be considered part of the public API, and thus is subject to change.

## Utils API

#### `sinon.restore(object);`

Restores all fake methods of supplied object

```javascript
    sinon.stub(obj);

    // run tests...

    sinon.restore(obj);
```

#### `sinon.restore(method);`

Restores supplied method

```javascript
    sinon.restore(obj.someMethod);
```

#### `sinon.createStubInstance(constructor);`

Creates a new object with the given function as the protoype and stubs all implemented functions.

The given constructor function is not invoked. See also the [stub API](../stubs).

#### `sinon.format(object);`

Formats an object for pretty printing in error messages. Sinon < 1.3.0
defaulted to coercing objects to strings. As of 1.3.0, Sinon uses [buster-format](https://busterjs.org/docs/buster-format/) by default, or Node's
[util](http://nodejs.org/docs/v0.6.6/api/util.html) module. Feel free to
override this method with your own implementation if you prefer different
visualization of e.g. objects. The method should return a string.

#### `sinon.log(string);`

Logs internal errors, helpful for debugging. By default this property is a noop function, set it to something that prints warnings in your
environment for more help, e.g. (if you are using JsTestDriver):

```javascript
sinon.log = function (message) {
    jstestdriver.console.log(message);
};
```
