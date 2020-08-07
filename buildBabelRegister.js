/* eslint-disable @typescript-eslint/no-var-requires */
import { relative } from 'path';

import register from '@babel/register';
import { matcher } from 'micromatch';

import config from '@monorepo/config';

const transpilationGlobs = [
  ...config.buildableSourceCodeGlobs,
  '.yarn/$$virtual/*/src/**/*',
  ...config.testCodeGlobs,
];

const transpilationIgnoreGlobs = config.buildableIgnoreGlobs;

const matchers = [...transpilationIgnoreGlobs, ...transpilationGlobs].map(matcher);

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
          return matchers.some(isMatch => isMatch(relativePath));
        }
      }
    },
  ],
});
