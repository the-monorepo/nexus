import globby from 'globby';
import { fork } from 'child_process';
import { resolve } from 'path';

export const run = async () => {
  const directories = await globby(
    [
      './{packages,build-packages,test}/**/*.test.{js,jsx,ts,tsx}',
      '!./**/node_modules/**',
      '!./coverage',
      '!./{packages,build-packages}/*/{dist,lib,esm}/**/*',
    ],
    { onlyFiles: true },
  );

  const importPaths = ['./test/require/babel.js', './test/helpers/globals.js'];
  const absoluteImportPaths = importPaths.map((path) => resolve(path));

  for (const testPath of directories) {
    fork(require.resolve('fl-addon-core'), ['fl-addon-mocha', testPath, JSON.stringify(absoluteImportPaths)], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });
  }
};

export default run;
run();
