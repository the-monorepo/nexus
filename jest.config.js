module.exports = {
  testMatch: ['<rootDir>/test/?(**/)?(*.)test.(t|j)s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  collectCoverage: true,
  coverageDirectory: './coverage/',
  collectCoverageFrom: ['src/**/*.ts'],
  transform: {
    '^.+\\.ts$': 'babel-jest',
  },
};
