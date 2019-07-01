import Mocha from 'mocha';
import { join } from 'path';
const run = async testPaths => {
  const mocha = new Mocha({
    allowUncaught: true,
    color: true,
    fullStackTrace: true,
  } as any);

  testPaths.forEach((testPath) => mocha.addFile(testPath));

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
