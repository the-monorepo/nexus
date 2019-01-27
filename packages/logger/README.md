# Logger

A preformatted, opinionated logger

## Installation

```bash
npm install --save @shawp/logger @shawp/winston-formats winston
```
or
```bash
yarn add @shawp/logger @shawp/winston-formats winston
```

## Examples

```javascript
const { logger, consoleTransport, fileTransport } = require('@shawp/logger');
const { join } = require('path');

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

