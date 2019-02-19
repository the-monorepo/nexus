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
  plugins: ['babel-plugin-istanbul'],
  overrides: [
    {
      test: ['./packages/my-resume', './packages/resume-template'],
      presets: [
        '@babel/preset-react',
        '@babel/preset-typescript',
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['last 2 versions'],
            },
          },
        ],
      ],
      plugins: ['babel-plugin-istanbul'],
    },
  ],
};
