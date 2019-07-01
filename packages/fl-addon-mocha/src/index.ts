import Mocha from 'mocha';
import { join } from 'path';
const run = async testPath => {
  const mocha = new Mocha({
    allowUncaught: true,
    color: true,
    fullStackTrace: true,
  } as any);
  mocha.addFile('./test/require/babel.js');
  mocha.addFile('./test/helpers/globals.js');
  mocha.addFile(testPath);

  try {
    const failures = await new Promise(resolve => {
      mocha.run(failures => {
        if (failures) {
          resolve(failures);
        } else {
          resolve();
        }
      });
    });
    if (failures) {
      console.warn('Tests failed!', failures);
    } else {
      console.info('Tests succeeded!');
    }
  } catch (err) {
    console.error(err);
  }
};
export default run;
