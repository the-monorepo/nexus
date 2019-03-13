const buildUtils = require('./build-packages/build-util/src');
module.exports = {
  testMatch: [
    '<rootDir>/**/*.(test|spec).(j|t)s?(x)',
    '<rootDir>/**/test.(j|t)s?(x)',
    '<rootDir>/**/spec.(j|t)s?(x)',
  ],
  collectCoverageFrom: [
    '<rootDir>/packages/*/src/**/*.(j|t)s?(x)',
    '<rootDir>/build-packages/*/src/**/*.(j|t)s?(x)',
    '!<rootDir>/packages/my-resume/src/**/*',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/lib/', '/esm/'],
  collectCoverage: true,
  resetMocks: true,
};
