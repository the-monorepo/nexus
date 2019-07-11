import Mocha from 'mocha';
import * as types from '@fault/addon-message-types';
import { IPCReporter } from './recordTests';
import { submitFileResult } from '@fault/messages';
import { cloneCoverage } from '@fault/istanbul-util';
import { ParentResult } from '@fault/messages';
const COVERAGE_KEY = '__coverage__';

export const initialize = async () => {
  const originalCacheKeys = new Set(Object.keys(require.cache));

  const clearCache = () => {
    const cacheKeysAfterTest = new Set(Object.keys(require.cache));

    for (const testCacheKey of cacheKeysAfterTest) {
      if (!originalCacheKeys.has(testCacheKey)) {
        delete require.cache[testCacheKey];
      }
    }
  };

  process.on('message', async (data: ParentResult) => {
    switch (data.type) {
      case types.STOP_WORKER: {
        process.exit(0);
        break;
      }
      case types.RUN_TEST: {
        const mocha = new Mocha({
          color: true,
          reporter: IPCReporter,
          fullStackTrace: true,
        } as any);

        mocha.addFile(require.resolve('./recordTests'));
        mocha.addFile(data.filePath);

        try {
          await new Promise(resolve => {
            global.beforeTestCoverage = cloneCoverage(global[COVERAGE_KEY]);
            mocha.run(async failures => {
              await submitFileResult(data);
              clearCache();
              resolve(failures);
            });
          });
        } catch (err) {
          console.error(err);
          process.exit(1);
        }
        break;
      }
    }
  });
};
export default initialize;
