import globby from 'globby';
import { fork, ChildProcess } from 'child_process';
import * as types from 'fl-addon-message-types';
import { ChildResult } from 'fl-messages';
import { runTest, stopWorker } from 'fl-messages';
import { reporter } from './default-reporter';

const addonEntryPath = require.resolve('./addon-entry');

const runAndRecycleProcesses = (
  tester,
  directories,
  processCount,
  absoluteImportPaths,
): Promise<any> => {
  const testsPerWorkerWithoutRemainder = Math.floor(directories.length / processCount);
  const remainders = directories.length % processCount;
  let i = 0;
  const testResults: any[] = [];
  const start = new Date();
  const forkForTest = (): ChildProcess =>
    fork(addonEntryPath, [tester, JSON.stringify(absoluteImportPaths)], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
      stdio: 'inherit',
    });

  const runTests = (worker: ChildProcess, testPaths: string[]) => {
    return Promise.all(
      testPaths.map(testPath =>
        runTest(worker, {
          filePath: testPath,
        }),
      ),
    );
  };

  const unfinishedFiles: Set<string> = new Set(directories);
  let workers: ChildProcess[] = [];
  return new Promise((resolve, reject) => {
    const setupWorkerHandle = (worker: ChildProcess) => {
      worker.on('message', async (message: ChildResult) => {
        switch (message.type) {
          case types.TEST: {
            testResults.push(message);
            break;
          }
          case types.FILE_FINISHED: {
            unfinishedFiles.delete(message.filePath);
            if (unfinishedFiles.size <= 0) {
              const end = new Date();
              const duration = end.getTime() - start.getTime();
              await Promise.all(workers.map(worker => stopWorker(worker, {})));
              resolve({ testResults, duration });
            }
            break;
          }
        }
      });
      worker.on('exit', code => {
        for (const otherWorker of workers) {
          if (otherWorker === worker) {
            continue;
          }
          // TODO: I believe otherWorker might cause this handler to be called yet again before the current handle finishes
          otherWorker.kill();
        }
        if (code !== 0) {
          reject(new Error('An error ocurred while running tests'));
        }
      });
    };

    while (i < remainders) {
      const testPaths = directories.splice(0, testsPerWorkerWithoutRemainder + 1);
      const worker = forkForTest();
      setupWorkerHandle(worker);
      runTests(worker, testPaths);
      workers[i] = worker;
      i++;
    }
    if (testsPerWorkerWithoutRemainder > 0) {
      while (i < processCount) {
        const testPaths = directories.splice(0, testsPerWorkerWithoutRemainder);
        const worker = forkForTest();
        setupWorkerHandle(worker);
        runTests(worker, testPaths);
        workers[i] = worker;
        i++;
      }
    }
  });
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
