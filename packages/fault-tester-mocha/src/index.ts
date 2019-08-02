import { submitFileResult, stoppedWorker } from '@fault/messages';
import { ParentResult, IPC, RunTestsPayload } from '@fault/types';
import { cloneCoverage } from '@fault/istanbul-util';
import { createMochaInstance, runMochaInstance } from './mocha-util';

const COVERAGE_KEY = '__coverage__';

type Options = {
  mocha?: string;
  sandbox?: boolean;
};

let running = false;

const exit = async (exitCode: number) => {
  await stoppedWorker({ coverage: global[COVERAGE_KEY] });
  process.exit(exitCode);
}
export const initialize = async (options: Options) => {
  const { mocha = 'mocha', sandbox = false } = options; 
  const Mocha = require(mocha);
  
  const originalCacheKeys = new Set(Object.keys(require.cache));

  const clearCache = () => {
    const cacheKeysAfterTest = new Set(Object.keys(require.cache));

    for (const testCacheKey of cacheKeysAfterTest) {
      if (!originalCacheKeys.has(testCacheKey)) {
        delete require.cache[testCacheKey];
      }
    }
  }; 

  const queue: RunTestsPayload[] = [];
  const runQueue = () => {
    if (running) {
      return;
    }
    
    running = true;

    return (async () => {
      while(queue.length > 0) {
        const data = queue.pop()!;
        if (sandbox) {
          for(const { testPath, key } of data.testsToRun) {   
            const mochaInstance = createMochaInstance(Mocha);
            mochaInstance.addFile(testPath);

            const startTime = Date.now();
            let endTime: number;

            clearCache();
            global.beforeTestCoverage = cloneCoverage(global[COVERAGE_KEY]);
            await runMochaInstance(mochaInstance, async () => {
              endTime = Date.now();
            });
            clearCache();

            const duration = endTime! - startTime;
            await submitFileResult({ duration, key, testPath });
          }
        } else {
          // Sort tests alphabetically
          data.testsToRun.sort((a, b) => a.testPath.localeCompare(b.testPath, 'en', { sensitivity: 'base' }));
          const mochaInstance = createMochaInstance(Mocha);
          for(const {testPath} of data.testsToRun) {  
            mochaInstance.addFile(testPath);
          }
          await runMochaInstance(mochaInstance, async () => {
            for(const {testPath, key } of data.testsToRun) {
              await submitFileResult({
                testPath,
                key,
                duration: 0
              });
            }
            clearCache();
          });  
        }
      }
      running = false;  
    })();
  }
  process.on('message', (data: ParentResult) => {
    switch (data.type) {
      case IPC.STOP_WORKER: {
        exit(0);
        break;
      }
      case IPC.RUN_TEST: {
        queue.push(data);
        runQueue();
        break;
      }
    }
  });
};
export default initialize;
