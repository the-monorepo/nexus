import globby from 'globby';
import { fork } from 'child_process';

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

  for (const testPath of directories) {
    fork(require.resolve('fl-addon-core'), ['fl-addon-mocha', testPath], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });
  }
};

export default run;
run();
