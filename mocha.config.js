module.exports = {
  require: ['./test/require/babel'],
  file: [
    'test/helpers/globals.js',
  ],
  extension: ['js', 'jsx', 'ts', 'tsx'],
  spec: [
    "build-packages/**/*.test.js",
    "packages/**/*.test.ts",
    "test/**/*.test.ts"
  ],
  exclude: [
    '**/node_modules/**',
    'coverage/**',
    'build-packages/*/{dist,lib,esm}/**',
    'packages/*/{dist,lib,esm}/**',
  ],
};
