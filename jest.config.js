const buildUtils = require('@by-example/build-utils');
module.exports = Object.assign(buildUtils.jest.settings(), {
  projects: ['<rootDir>', '<rootDir>/packages/*', '<rootDir>/build-packages/*'],
});
