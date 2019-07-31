import { IPCReporter } from './recordTests';
import { submitFileResult } from '@fault/messages';
import { ParentResult, IPC, RunTestsPayload } from '@fault/types';
import { cloneCoverage } from '@fault/istanbul-util';
const COVERAGE_KEY = '__coverage__';

type Options = {
  mocha?: string;
  sandbox?: boolean;
};

const createMochaInstance = (Mocha) => {
  const mochaInstance = new Mocha({
    color: true,
    reporter: IPCReporter,
    fullStackTrace: true,
  } as any);
  mochaInstance.addFile(require.resolve('./recordTests'));
  return mochaInstance;
}

const runMochaInstance = async (mochaInstance, runHandle) => {
  try {
    await new Promise(resolve => {
      mochaInstance.run(async failures => {
        await runHandle(failures);
        resolve(failures);
      });
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  } 
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
  let running = false;
  const runQueue = async (data: RunTestsPayload) => {
    queue.push(data);
    if (running) {
      return;
    }
    
    running = true;
    while(queue.length > 0) {
      const data = queue.pop()!;
      if (sandbox) {
        for(const {testPath, estimatedDuration } of data.testsToRun) {    
          const mochaInstance = createMochaInstance(Mocha);
          mochaInstance.addFile(testPath);
          global.beforeTestCoverage = cloneCoverage(global[COVERAGE_KEY]);
          await runMochaInstance(mochaInstance, async () => {
            await submitFileResult({ testPath, estimatedDuration });
            clearCache();
          });
        }
      } else {
        const mochaInstance = createMochaInstance(Mocha);
        for(const {testPath} of data.testsToRun) {  
          mochaInstance.addFile(testPath);
        }
        await runMochaInstance(mochaInstance, async () => {
          for(const {testPath, estimatedDuration} of data.testsToRun) {
            await submitFileResult({
              testPath,
              estimatedDuration
            });
          }
          clearCache();
        });  
      }
    }
    running = false;
  }
  process.on('message', (data: ParentResult) => {
    switch (data.type) {
      case IPC.STOP_WORKER: {
        process.exit(0);
        break;
      }
      case IPC.RUN_TEST: {
        runQueue(data);
        break;
      }
    }
  });
};
export default initialize;
