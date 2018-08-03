module.exports = {
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
  plugins: [
    [
      'babel-plugin-istanbul',
      {
        include: ['src/**'],
        exclude: [
          'lib/**',
          'coverage/**',
          'tests/**',
          'test{,-*}.{j,t}s',
          '**/*.test.{j,t}s',
          '**/__tests__/**',
          '**/node_modules/**',
        ],
      },
    ],
  ],
};
