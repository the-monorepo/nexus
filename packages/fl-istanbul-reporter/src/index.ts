import globby from 'globby';
import { logger, consoleTransport } from '@pshaw/logger';
import { fork } from 'child_process';
import { join } from 'path';
const l = logger().add(consoleTransport());
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
  fork(join(__dirname, '../../fl-mocha-addon/lib/index'), directories);
};
run();
