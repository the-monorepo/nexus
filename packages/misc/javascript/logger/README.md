# Logger

A preformatted, opinionated logger

## Installation

```bash
npm install --save @pshaw/logger@2.0.5-0
```
or
```bash
yarn add @pshaw/logger@2.0.5-0
```

## Examples

```javascript
/* eslint-disable no-console */

const { readFile } = require('fs/promises');
const { join } = require('path');

const fromSchema = require('hook-schema');

const { withHooks } = fromSchema({
  readFile: null,
  parseJson: null,
});

/**
 * A simple JSON reading method with hook-schema added for extensibility.
 * hook-schema is more useful in more complicated logic but its ability to
 * decouple different logic.
 */
async function readJson(filePath, partialHooks) {
  const context = {
    path: filePath,
    encoding: 'utf8',
  };
  const hooks = withHooks(partialHooks);

  await hooks.before.readFile(context);
  context.contents = await readFile(context.path, context.encoding);
  await hooks.after.readFile(context);

  await hooks.before.parseJson(context);
  context.json = JSON.parse(context.contents);
  await hooks.after.parseJson(context);

  return context.json;
}

/**
 * Harnesses the utility of hook-schema adding the ability to log messages at
 * each step of the readJson function without adding the code directly into readJson.
 */
async function loggedReadJson(filePath) {
  const hooks = {
    before: {
      async readFile({ path }) {
        console.log(`Reading ${path}...`);
      },
      async parseJson({ path }) {
        console.log(`Parsing ${path}...`);
      },
    },
  };
  return await readJson(filePath, hooks);
}

async function run() {
  await loggedReadJson(join(__dirname, 'package.json'));
}
run();
```

---
This documentation was generated using [writeme](https://www.npmjs.com/package/@writeme/core)
