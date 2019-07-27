const { resolve } = require('path');
module.exports = {
  testMatch: resolve(__dirname, 'test/*.js'),
  setupFiles: [resolve(__dirname, 'babel'), resolve(__dirname, 'test/bootstrap')]
}