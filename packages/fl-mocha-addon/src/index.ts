process.env.NODE_ENV = 'test';
process.env.BABEL_ENV = 'test';
import Mocha from 'mocha';
import globby from 'globby';
import { logger, consoleTransport } from '@pshaw/logger';
import { fork } from 'child_process';
require('@babel/register')({
  ignore: [/node_modules/],
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
});
console.log('test', process.argv);

const l = logger().add(consoleTransport());
export const run = async () => {
  const directories = await globby([
    './{packages,build-packages,test}/**/*.test.{js,jsx,ts,tsx}',
    '!./**/node_modules/**',
    '!./coverage',
    '!./{packages,build-packages}/*/{dist,lib,esm}/**/*',
  ], { onlyFiles: true });  
  const mocha = new Mocha({
    allowUncaught: true,
    color: true,
    fullStackTrace: true,
  } as any);
  
  mocha.addFile('./test/require/babel.js');
  mocha.addFile('./test/helpers/globals.js');

  directories.forEach((filePath) => mocha.addFile(filePath));
  
  try{
    const failures = await new Promise((resolve) => {
      mocha.run((failures) => {
        if(failures) {
          resolve(failures)
        } else {
          resolve();
        }
      });
    }); 
    if (failures) {
      l.warn('Tests failed!', failures);
    } else {
      l.info('Tests succeeded!');
    }
  } catch(err) {
    l.error(err);
  }

};
export default run;
run();