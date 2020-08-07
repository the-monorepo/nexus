/* eslint-disable @typescript-eslint/no-var-requires */
const { relative } = require('path');

const register = require('@babel/register');
const { some } = require('micromatch');

const config = require('@monorepo/config');

const transpilationGlobs = [
  ...config.buildableSourceCodeGlobs,
  '.yarn/$$virtual/*/src/**/*',
  ...config.testDirGlobs.map((dir) => `${dir}/**/*`),
];

const transpilationIgnoreGlobs = config.buildableIgnoreGlobs;

register({
  extensions: config.codeExtensions.map((extension) => `.${extension}`),
  only: [
    (testPath) => {
      const relativePath = relative(__dirname, testPath);
      switch(relativePath) {
        case 'webpack.config.ts':
        case 'original-code-require-override.ts':
        case 'buildplan.ts':
          return true;
        default: {
          return some(relativePath, transpilationGlobs, { ignore: transpilationIgnoreGlobs });    
        }
      }
    },
  ],
});
