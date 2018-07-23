module.exports = {
  testMatch: ['<rootDir>/tests/?(**/)?(*.)test.(t|j)s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  }
};