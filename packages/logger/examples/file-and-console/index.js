const { logger, consoleTransport, fileTransport } = require('@shawp/logger');
const { join } = require('path');

const l = logger().add(consoleTransport()).add(fileTransport({
  path: join(__dirname, 'file-and-console.log')
}));

l.info('test');
l.error('rawr');
l.tag('tagged').info('test');