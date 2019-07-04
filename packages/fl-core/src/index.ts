import globby from 'globby';
import { fork } from 'child_process';
import * as types from 'fl-addon-message-types';
import { AssertionResult, ExecutionResult, TestResult } from 'fl-addon-core';
import { reporter } from './default-reporter';

const addonEntryPath = require.resolve('./addon-entry');

const runAndRecycleProcesses = async (
  tester,
  directories,
  processCount,
  absoluteImportPaths,
) => {
  const testsPerWorkerWithoutRemainder = Math.floor(directories.length / processCount);
  const remainders = directories.length % processCount;
  let i = 0;
  const testResults: any[] = [];
  const forkForTest = testPaths => {
    const forkTest = fork(
      addonEntryPath,
      [tester, JSON.stringify(testPaths), JSON.stringify(absoluteImportPaths)],
      {
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
        stdio: 'inherit',
      },
    );
    return new Promise((resolve, reject) => {
      forkTest.on(
        'message',
        (message: ExecutionResult | AssertionResult | TestResult) => {
          switch (message.type) {
            case types.EXECUTION: {
              resolve(message.passed);
              break;
            }
            case types.TEST: {
              testResults.push(message);
              break;
            }
          }
        },
      );
      forkTest.on('exit', code => {
        if (code !== 0) {
          reject(new Error('An error ocurred while running tests'));
        }
      });
    });
  };

  let forkPromises: any[] = [];
  while (i < remainders) {
    const testPaths = directories.splice(0, testsPerWorkerWithoutRemainder + 1);
    forkPromises[i] = forkForTest(testPaths);
    i++;
  }
  if (testsPerWorkerWithoutRemainder > 0) {
    while (i < processCount) {
      const testPaths = directories.splice(0, testsPerWorkerWithoutRemainder);
      forkPromises[i] = forkForTest(testPaths);
      i++;
    }
  }

  await Promise.all(forkPromises);
  return { testResults };
};

export const run = async ({ tester, testMatch, setupFiles }) => {
  const directories = await globby(testMatch, { onlyFiles: true });
  // We pop the paths off the end of the list so the first path thing needs to be at the end
  directories.reverse();

  const absoluteImportPaths = setupFiles.map(path =>
    require.resolve(path, {
      paths: [process.cwd()],
    }),
  );

  const processCount = 1; //cpus().length;

  const results = await runAndRecycleProcesses(
    tester,
    directories,
    processCount,
    absoluteImportPaths,
  );
  await reporter(results);
  if (results.testResults.some(result => !result.passed)) {
    process.exit(1);
  }
};

export default run;
