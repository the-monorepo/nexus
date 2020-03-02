# Using enzyme with Jest

## Configure with Jest

To run the setup file to configure Enzyme and the Adapter (as shown in the [Installation docs](http://airbnb.io/enzyme/docs/installation/)) with Jest, set `setupTestFrameworkScriptFile` in your config file (check [Jest's documentation](http://jestjs.io/docs/en/configuration) for the possible locations of that config file) to literally the string `<rootDir>` and the path to your setup file.

```json
{
  "jest": {
    "setupTestFrameworkScriptFile": "<rootDir>src/setupTests.js"
  }
}
```

## Jest version 15 and up

Starting with version 15, Jest [no longer mocks modules by default](https://facebook.github.io/jest/blog/2016/09/01/jest-15.html). Because of this, you no longer have to add _any_ special configuration for Jest to use it with enzyme.

Install Jest, and its Babel integrations, as recommended in the [Jest docs](https://facebook.github.io/jest/docs/en/getting-started.html). Install enzyme. Then, simply require/import React, enzyme functions, and your module at the top of a test file.

```js
import React from 'react';
import { shallow, mount, render } from 'enzyme';

import Foo from '../Foo';
```

You do **not** need to include Jest's own renderer, unless you want to use it _only_ for Jest snapshot testing.

## Example Project for Jest version 15+

- [Example test for Jest 15+](https://github.com/vjwilson/enzyme-example-jest)

## Jest prior to version 15

If you are using Jest 0.9 – 14.0 with enzyme and using Jest's automocking feature, you will need to mark react and enzyme to be unmocked in your `package.json`:

`package.json`:
```json
{
  "jest": {
    "unmockedModulePathPatterns": [
      "node_modules/react/",
      "node_modules/enzyme/"
    ]
  }
}
```

If you are using a previous version of Jest together with npm3, you may need to unmock [more modules](https://github.com/airbnb/enzyme/blob/78febd90fe2fb184771b8b0356b0fcffbdad386e/docs/guides/jest.md).
