import { cloneCoverage } from '@fault/istanbul-util';

import { ParentResult, IPC, RunTestsPayload } from '@fault/types';

import { client } from './client.ts';

import { createMochaInstance, runMochaInstance } from './mocha-util.ts';

import * as resultful from 'resultful';

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

            clearCache();

            console.log('running', testPath);

            globalThis.beforeTestCoverage = cloneCoverage(globalThis[COVERAGE_KEY]);
            const startTime = Date.now();

            const result = await runMochaInstance(mochaInstance);

            clearCache();
            const endTime = Date.now();
            const duration = endTime - startTime;

            if (resultful.isUnknownFailure(result)) {
              console.error(result.failure.unknown);
              process.exitCode = 1;
            }
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

          const result = await runMochaInstance(mochaInstance);

          if (resultful.isUnknownFailure(result)) {
            console.error(result.failure.unknown);
            process.exitCode = 1;
          } else {
            for (const { testPath, key } of data.testsToRun) {
              await client.submitFileResult({
                testPath,
                key,
                duration: 0,
              });
            }
          }

          clearCache();
        }
      }
      running = false;
    })();
  };
  process.on('message', (candidatePayload: ParentResult) => {
    return client.on(candidatePayload, async (data) => {
      switch (data.type) {
        case IPC.STOP_WORKER: {
          await client.stoppedWorker({ coverage: globalThis[COVERAGE_KEY] });
          queue.splice(0, queue.length);
          process.disconnect();
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
