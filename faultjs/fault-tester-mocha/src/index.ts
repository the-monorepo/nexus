import { cloneCoverage } from '@fault/istanbul-util';

import { ParentResult, IPC, RunTestsPayload } from '@fault/types';

import { client } from './client';

import { createMochaInstance, runMochaInstance } from './mocha-util';

const COVERAGE_KEY = '__coverage__';

type Options = {
  mocha?: string;
  sandbox?: boolean;
  require?: string[];
  timeout?: number;
  bail?: boolean;
};

let running = false;

export const initialize = async (options: Options) => {
  const {
    mocha = 'mocha',
    sandbox = false,
    require: relativeRequireFiles = [],
    timeout,
    bail = false,
  } = options;

  const requireFiles = relativeRequireFiles.map((filePath) =>
    require.resolve(filePath, {
      paths: [process.cwd()],
    }),
  );

  const mochaModulePath = require.resolve(mocha, {
    paths: [process.cwd()],
  });
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Mocha = require(mochaModulePath);

  const originalCacheKeys = new Set(Object.keys(require.cache));

  const clearCache = () => {
    const cacheKeysAfterTest = new Set(Object.keys(require.cache));

    for (const testCacheKey of cacheKeysAfterTest) {
      if (!originalCacheKeys.has(testCacheKey)) {
        delete require.cache[testCacheKey];
      }
    }
  };
  const mochaOptions = { timeout, bail, allowUncaught: false };
  const queue: RunTestsPayload[] = [];
  const runQueue = () => {
    if (running) {
      return;
    }
    running = true;

    return (async () => {
      while (queue.length > 0) {
        const payload = queue.pop()!;
        const data = payload.data;
        if (sandbox) {
          for (const { testPath, key } of data.testsToRun) {
            const mochaInstance = createMochaInstance(Mocha, mochaOptions, requireFiles);
            mochaInstance.addFile(testPath);

            const startTime = Date.now();
            let endTime: number;

            clearCache();
            global.beforeTestCoverage = cloneCoverage(global[COVERAGE_KEY]);
            try {
              await runMochaInstance(mochaInstance, async () => {
                endTime = Date.now();
              });
            } catch (err) {
              console.error(err);
              process.exitCode = 1;
            }
            clearCache();

            const duration = endTime! - startTime;
            await client.submitFileResult({ duration, key, testPath });
          }
        } else {
          // Sort tests alphabetically
          data.testsToRun.sort((a, b) =>
            a.testPath.localeCompare(b.testPath, 'en', { sensitivity: 'base' }),
          );
          const mochaInstance = createMochaInstance(Mocha, mochaOptions, requireFiles);
          for (const { testPath } of data.testsToRun) {
            mochaInstance.addFile(testPath);
          }
          try {
            await runMochaInstance(mochaInstance, async () => {
              for (const { testPath, key } of data.testsToRun) {
                await client.submitFileResult({
                  testPath,
                  key,
                  duration: 0,
                });
              }
              clearCache();
            });
          } catch (err) {
            console.error(err);
            process.exit(1);
          }
        }
      }
      running = false;
    })();
  };
  process.on('message', (candidatePayload: ParentResult) => {
    return client.on(candidatePayload, async (data) => {
      switch (data.type) {
        case IPC.STOP_WORKER: {
          await client.stoppedWorker({ coverage: global[COVERAGE_KEY] }).then(() => {
            process.exit(0);
          });
          break;
        }
        case IPC.TEST_FILE: {
          queue.push(data);
          await runQueue();
          break;
        }
      }
    });
  });
};
export default initialize;
