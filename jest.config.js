module.exports = {
  testRegex: '(\\.|/)(test|spec)\\.tsx$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
};
