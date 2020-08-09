/* eslint-disable @typescript-eslint/no-var-require(s */
const { relative } = require("path");

const register = require("@babel/register");
const { matcher } = require("micromatch");

const config = require("@monorepo/config");

const transpilationGlobs = [
  ...config.buildableSourceCodeGlobs,
  ...config.testCodeGlobs,
];

const transpilationIgnoreGlobs = config.buildableIgnoreGlobs;

const matchers = [...transpilationIgnoreGlobs, ...transpilationGlobs].map(
  matcher
);

register({
  extensions: config.codeExtensions.map((extension) => `.${extension}`),
  only: [
    (testPath) => {
      const relativePath = relative(__dirname, testPath);
      switch (relativePath) {
        case "webpack.config.ts":
        case "original-code-require-override.ts":
        case "buildplan.ts":
          return true;
        default: {
          return matchers.some((isMatch) => isMatch(relativePath));
        }
      }
    },
  ],
});
