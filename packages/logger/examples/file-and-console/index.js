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

const taggedL = l.child({ tags: 'tagged' });
taggedL.info('test');
