const buildUtils = require('./build-packages/build-util/src');
module.exports = Object.assign(buildUtils.jest.settings(), {
  projects: ['<rootDir>', '<rootDir>/packages/*', '<rootDir>/build-packages/*'],
});
