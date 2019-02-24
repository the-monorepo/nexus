function settings() {
  return {
    testMatch: [
      '<rootDir>/test/**/*.test.(j|t)s?(x)',
      '<rootDir>/test/**/test.(j|t)s?(x)',
    ],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/lib/', '/esm/'],
    collectCoverage: true,
    resetMocks: true,
    testURL: 'http://localhost/',
  };
}
module.exports = { settings };
