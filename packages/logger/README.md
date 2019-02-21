# Logger

A preformatted, opinionated logger

## Installation

```bash
npm install --save @pshaw/logger @pshaw/winston-formats winston
```
or
```bash
yarn add @pshaw/logger @pshaw/winston-formats winston
```

## Examples

```javascript
const { join } = require('path');

const { logger, consoleTransport, fileTransport } = require('@pshaw/logger');

const l = logger()
  .add(consoleTransport())
  .add(
    fileTransport({
      path: join(__dirname, 'file-and-console.log'),
    }),
  );

l.info('test');
l.error('rawr');
l.tag('tagged').info('test');
```

---
This documentation was generated using [writeme](https://www.npmjs.com/package/@pshaw/writeme)
