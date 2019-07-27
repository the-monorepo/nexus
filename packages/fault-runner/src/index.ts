import globby from 'globby';
import { fork, ChildProcess } from 'child_process';
import {
  IPC,
  TestResult,
  AssertionFailureResult,
  ChildResult,
  TesterResults,
} from '@fault/types';
import { runTest, stopWorker } from '@fault/messages';
import { join } from 'path';
import {
  TestHookOptions,
  PartialTestHookOptions,
  schema,
} from '@fault/addon-hook-schema';
import * as defaultReporter from './default-reporter';
import { cpus } from 'os';

const addonEntryPath = require.resolve('./addon-entry');

const runAndRecycleProcesses = (
  tester: string,
  directories: string[],
  processCount: number,
  setupFiles: string[],
  hooks: TestHookOptions,
  cwd: string = process.cwd(),
  env: { [s: string]: any },
  testerOptions = {}
): Promise<TesterResults> => {
  const testsPerWorkerWithoutRemainder = Math.floor(directories.length / processCount);
  const remainders = directories.length % processCount;
  let i = 0;
  const testResults: Map<string, TestResult> = new Map();
  const assertionResults: Map<string, AssertionFailureResult> = new Map();
  const start = new Date();
  const forkForTest = (): ChildProcess =>
    fork(addonEntryPath, [tester, JSON.stringify(testerOptions), JSON.stringify(setupFiles)], {
      env,
      cwd,
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
    const runAllTestsInUnfinishedFiles = () => {
      const unfinishedFilePaths = [...unfinishedFiles];
      while (i < remainders) {
        const testPaths = unfinishedFilePaths.splice(
          0,
          testsPerWorkerWithoutRemainder + 1,
        );
        const worker = forkForTest();
        setupWorkerHandle(worker);
        runTests(worker, testPaths);
        workers[i] = worker;
        i++;
      }
      if (testsPerWorkerWithoutRemainder > 0) {
        while (i < processCount) {
          const testPaths = unfinishedFilePaths.splice(0, testsPerWorkerWithoutRemainder);
          const worker = forkForTest();
          setupWorkerHandle(worker);
          runTests(worker, testPaths);
          workers[i] = worker;
          i++;
        }
      }
    };
    const setupWorkerHandle = (worker: ChildProcess) => {
      worker.on('message', async (message: ChildResult) => {
        switch (message.type) {
          case IPC.ASSERTION: {
            assertionResults.set(message.key, message);
            break;
          }
          case IPC.TEST: {
            testResults.set(message.key, {
              ...message,
            });
            await hooks.on.testResult(message);
            break;
          }
          case IPC.FILE_FINISHED: {
            unfinishedFiles.delete(message.filePath);
            await hooks.on.fileFinished();
            if (unfinishedFiles.size <= 0) {
              const end = new Date();
              const duration = end.getTime() - start.getTime();
              const results = { testResults, duration, assertionResults };

              for (const allFilesFinishedPromise of hooks.on.allFilesFinished(results)) {
                const filePathIterator = await allFilesFinishedPromise;
                for (const filePath of filePathIterator) {
                  unfinishedFiles.add(filePath);
                }
              }

              if (unfinishedFiles.size <= 0) {
                await Promise.all(workers.map(worker => stopWorker(worker, {})));
                resolve(results);
              } else {
                runAllTestsInUnfinishedFiles();
              }
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

    runAllTestsInUnfinishedFiles();
  });
};

export type RunOptions = {
  tester: string;
  testMatch: string | string[];
  cwd?: string;
  setupFiles?: string[];
  addons?: PartialTestHookOptions[];
  reporters?: PartialTestHookOptions[];
  workers?: number;
  env?: { [s: string]: any },
  testerOptions?: any
};
export const run = async ({
  tester,
  testMatch,
  setupFiles = [],
  addons = [],
  workers = cpus().length,
  cwd = process.cwd(),
  reporters = [defaultReporter.createPlugin({ dir: join(cwd, 'coverage') })],
  env = process.env,
  testerOptions
}: RunOptions) => {
  addons.push(...reporters);

  const hooks: TestHookOptions = schema.merge(addons);

  const directories = await globby(testMatch, { onlyFiles: true });
  // We pop the paths off the end of the list so the first path thing needs to be at the end
  directories.reverse();

  // TODO: Still need to add a scheduling algorithm
  const processCount = workers;

  const results: TesterResults = await runAndRecycleProcesses(
    tester,
    directories,
    processCount,
    setupFiles,
    hooks,
    cwd,
    env,
    testerOptions
  );

  await hooks.on.complete(results);

  return ![...results.testResults.values()].some(result => !result.passed);
};

export default run;
