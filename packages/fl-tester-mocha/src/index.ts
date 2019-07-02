import Mocha from 'mocha';
import { submitExecutionResult } from 'fl-addon-core';

const run = async testPaths => {
  const mocha = new Mocha({
    allowUncaught: true,
    color: true,
    reporter: function() {},
    fullStackTrace: true,
  } as any);

  mocha.addFile(require.resolve('./recordTests'));
  testPaths.forEach(testPath => mocha.addFile(testPath));

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
    submitExecutionResult({
      passed: !failures,
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
export default run;
