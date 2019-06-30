import globby from 'globby';
import { fork } from 'child_process';
export const run = async (runnerModule) => {
  const filePaths = await globby([
    './{packages,build-packages,test}/**/*.test.{js,jsx,ts,tsx}',
    '!./**/node_modules/**',
    '!./coverage',
    '!./{packages,build-packages}/*/{dist,lib,esm}/**/*',
  ], { onlyFiles: true });
  filePaths.forEach(async () => {
    //await 
  });
}
export default run;
