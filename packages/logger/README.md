# Logger

A preformatted, opinionated logger

## Installation

`npm install --save @pshaw/logger`
or
`yarn add @pshaw/logger`

## Examples

```javascript
const { logger, consoleTransport, fileTransport } = require('@pshaw/logger');
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

