function settings() {
  return {
    testMatch: ['<rootDir>/test/?(**/)?(*.)test.(t|j)s?(x)'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/lib/'],
    collectCoverage: true,
    testURL: 'http://localhost/',
    transform: {
      '^.+\\.[jt]sx?$': 'babel-jest',
    },
  };
}
module.exports = { settings };
