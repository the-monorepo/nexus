import { IPCReporter } from './recordTests';
import { submitFileResult } from '@fault/messages';
import { ParentResult, IPC, RunTestPayload } from '@fault/types';
import { cloneCoverage } from '@fault/istanbul-util';
const COVERAGE_KEY = '__coverage__';

type Options = {
  mocha?: string;
  resetRequireCache?: boolean;
};

export const initialize = async (options: Options) => {
  const { mocha = 'mocha', resetRequireCache = true } = options; 
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

  const queue: RunTestPayload[] = [];
  let running = false;
  const runQueue = async () => {
    if (running) {
      return;
    }
    running = true;
    while(queue.length > 0) {
      const data = queue.pop()!;
      const mochaInstance = new Mocha({
        color: true,
        reporter: IPCReporter,
        fullStackTrace: true,
      } as any);

      mochaInstance.addFile(require.resolve('./recordTests'));
      mochaInstance.addFile(data.filePath);

      try {
        await new Promise(resolve => {
          global.beforeTestCoverage = cloneCoverage(global[COVERAGE_KEY]);

          mochaInstance.run(async failures => {
            await submitFileResult(data);
            if (resetRequireCache) {
              clearCache();
            }
            resolve(failures);
          });
        });
      } catch (err) {
        console.error(err);
        process.exit(1);
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
        queue.push(data);
        runQueue();
        break;
      }
    }
  });
};
export default initialize;
