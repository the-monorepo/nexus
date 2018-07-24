function settings() {
  return {
    testMatch: ['<rootDir>/tests/?(**/)?(*.)test.(t|j)s?(x)'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    transform: {
      '^.+\\.[jt]sx?$': 'babel-jest',
    },
  };
}
module.exports = { settings };
