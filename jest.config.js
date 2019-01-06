module.exports = {
  testMatch: ['<rootDir>/tests/?(**/)?(*.)test.(t|j)s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  collectCoverage: true,
  coverageDirectory: './coverage/',
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,js}'],
  resetMocks: true,
  transform: {
    '^.+\\.ts$': 'babel-jest',
    '^.+\\.js$': 'babel-jest',
  },
};
