---
layout: page
title: Fake timers - Sinon.JS
breadcrumb: fake timers
---

Fake timers are synchronous implementations of `setTimeout` and friends that
Sinon.JS can overwrite the global functions with to allow you to more easily
test code using them.

Fake timers provide a `clock` object to pass time, which can also be used to control `Date` objects created through either `new Date();`
or `Date.now();` (if supported by the browser).

For standalone usage of fake timers it is recommended to use [lolex](https://github.com/sinonjs/lolex) package instead. It provides the same
set of features (Sinon uses it under the hood) and was previously extracted from Sinon.JS.

```javascript
{
    setUp: function () {
        this.clock = sinon.useFakeTimers();
    },

    tearDown: function () {
        this.clock.restore();
    },

    "test should animate element over 500ms" : function(){
        var el = jQuery("<div></div>");
        el.appendTo(document.body);

        el.animate({ height: "200px", width: "200px" });
        this.clock.tick(510);

        assertEquals("200px", el.css("height"));
        assertEquals("200px", el.css("width"));
    }
}
```


## Fake timers API


#### `var clock = sinon.useFakeTimers();`

Causes Sinon to replace the global `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`, `setImmediate`, `clearImmediate` and `Date` with a custom implementation which is bound to the returned `clock` object.

Starts the clock at the UNIX epoch (timestamp of 0).


#### `var clock = sinon.useFakeTimers(now);`

As above, but rather than starting the clock with a timestamp of 0, start at the provided timestamp.

*Since `sinon@2.0.0`*

You can also pass in a Date object, and its `getTime()` will be used for the starting timestamp.

#### `var clock = sinon.useFakeTimers([now, ]prop1, prop2, ...);`

Sets the clock start timestamp and names functions to fake. If the first argument is not numeric, it sets the clock to 0 and treats all arguments as names of functions to fake.

Possible functions are `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`, `setImmediate`, `clearImmediate` and `Date`.  Any functions not listed continue to use the original version of the function, including the actual time for the timestamp. This can have surprising results and should be done with care.

Note that if no functions are listed, the default behavior is to replace all eligible functions.


#### `clock.tick(ms);`

Tick the clock ahead `ms` milliseconds.

Causes all timers scheduled within the affected time range to be called.


#### `clock.restore();`

Restore the faked methods.

Call in e.g. `tearDown`.
