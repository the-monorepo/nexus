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
import {
  TestHookOptions,
  PartialTestHookOptions,
  schema,
} from '@fault/addon-hook-schema';
import defaultReporter from './default-reporter';
import { cpus } from 'os';

const addonEntryPath = require.resolve('./addon-entry');

const runAndRecycleProcesses = (
  tester: string,
  directories: string[],
  processCount: number,
  absoluteImportPaths: string[],
  hooks: TestHookOptions,
): Promise<TesterResults> => {
  const testsPerWorkerWithoutRemainder = Math.floor(directories.length / processCount);
  const remainders = directories.length % processCount;
  let i = 0;
  const testResults: Map<string, TestResult> = new Map();
  const assertionResults: Map<string, AssertionFailureResult> = new Map();
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
  testMatch: string;
  setupFiles: string[];
  addons: PartialTestHookOptions[];
  reporters?: PartialTestHookOptions[];
  workers?: number;
};
export const run = async ({
  tester,
  testMatch,
  setupFiles,
  addons = [],
  reporters = [defaultReporter],
  workers = cpus().length,
}: RunOptions) => {
  addons.push(...reporters);

  const hooks: TestHookOptions = schema.merge(addons);

  const directories = await globby(testMatch, { onlyFiles: true });
  // We pop the paths off the end of the list so the first path thing needs to be at the end
  directories.reverse();

  const absoluteImportPaths = setupFiles.map(path =>
    require.resolve(path, {
      paths: [process.cwd()],
    }),
  );

  // TODO: Still need to add a scheduling algorithm
  const processCount = workers;

  const results: TesterResults = await runAndRecycleProcesses(
    tester,
    directories,
    processCount,
    absoluteImportPaths,
    hooks,
  );

  await hooks.on.complete(results);

  if ([...results.testResults.values()].some(result => !result.passed)) {
    process.exit(1);
  }
};

export default run;
