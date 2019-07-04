import Mocha from 'mocha';
import { submitExecutionResult } from 'fl-addon-core';
import { IPCReporter } from './recordTests';
import { cloneCoverage } from 'fl-istanbul-util';
const COVERAGE_KEY = '__coverage__';

const run = async testPaths => {
  let passed = true;
  for(const testPath of testPaths) {
    const mocha = new Mocha({
      allowUncaught: true,
      color: true,
      reporter: IPCReporter,
      fullStackTrace: true,
    } as any);
    
    global.beforeTestCoverage = cloneCoverage(global[COVERAGE_KEY]);
    mocha.addFile(require.resolve('./recordTests'));
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
        passed = false;
      }
    } catch (err) {
      console.error(err);
      process.exit(1);
    }  
  }
  
  await submitExecutionResult({
    passed,
  });
};
export default run;
