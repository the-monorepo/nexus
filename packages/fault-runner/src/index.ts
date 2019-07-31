import globby from 'globby';
import { fork, ChildProcess } from 'child_process';
import {
  IPC,
  TestResult,
  ChildResult,
  TesterResults,
  RunTestData,
} from '@fault/types';
import { runTests, stopWorker } from '@fault/messages';
import { join } from 'path';
import {
  TestHookOptions,
  PartialTestHookOptions,
  schema,
} from '@fault/addon-hook-schema';
import * as defaultReporter from './default-reporter';
import { cpus } from 'os';

const addonEntryPath = require.resolve('./addon-entry');

type WorkerInfo = {
  process: ChildProcess,
  totalPendingDuration: number,
}
const runAndRecycleProcesses = async (
  tester: string,
  testMatch: string | string[],
  processCount: number,
  setupFiles: string[],
  hooks: TestHookOptions,
  cwd: string = process.cwd(),
  env: { [s: string]: any },
  testerOptions = {}
): Promise<TesterResults> => {
  let i = 0;
  const testResults: Map<string, TestResult> = new Map();
  const testDurations: Map<string, number> = new Map();
  const start = new Date();
  const forkForTest = (): ChildProcess =>
    fork(addonEntryPath, [tester, JSON.stringify(testerOptions), JSON.stringify(setupFiles)], {
      env,
      cwd,
      stdio: 'inherit',
    });

  const totalPendingFiles: Map<string, number> = new Map();
  
  const testFileQueue: string[] = await globby(testMatch, { onlyFiles: true });

  // TODO: Obtain actual time
  for(const testPath of testFileQueue) {
    testDurations.set(testPath, 1);
  }

  const resortFileQueue = () => {
    testFileQueue.sort((a, b) => testDurations.get(a)! - testDurations.get(b)!)
  }

  resortFileQueue();

  const addTestsToWorker = (worker: WorkerInfo, testPaths: string[]) => {
    const testsToRun: RunTestData[] = [];
    for(const testPath of testPaths) {
      const duration = testDurations.get(testPath)!;
      worker.totalPendingDuration += duration;
      testsToRun.push({
        testPath,
        estimatedDuration: duration
      });

      const originalPendingTestCount = totalPendingFiles.get(testPath);
      if (originalPendingTestCount !== undefined) {
        totalPendingFiles.set(testPath, originalPendingTestCount + 1);
      } else {
        totalPendingFiles.set(testPath, 1);
      }
    }
    runTests(worker.process, { testsToRun });
  }

  const workers: WorkerInfo[] = [];
  for(let w = 0; w < processCount; w++)  {
    const worker: WorkerInfo = {
      process: forkForTest(),
      totalPendingDuration: 0
    };
    workers[w] = worker;
  }

  const bufferCount = 2;
  const addInitialTests = () => {
    for(const worker of workers) {
      addTestsToWorker(worker, testFileQueue.splice(0, bufferCount));
    }
  }

  const addAQueuedTestWorker = (worker: WorkerInfo) => {
    const isHighestDuration = !workers.some(otherWorker => worker !== otherWorker && otherWorker.totalPendingDuration > worker.totalPendingDuration);
    const testPath = isHighestDuration ? testFileQueue.shift()! : testFileQueue.pop()!;
    addTestsToWorker(worker, [testPath]);
  }

  return new Promise((resolve, reject) => {
    const setupWorkerHandle = (worker: WorkerInfo) => {
      worker.process.on('message', async (message: ChildResult) => {
        switch (message.type) {
          case IPC.TEST: {
            testResults.set(message.key, message);
            await hooks.on.testResult(message);
            break;
          }
          case IPC.FILE_FINISHED: {
            worker.totalPendingDuration -= message.estimatedDuration;
            const originalFileCount = totalPendingFiles.get(message.testPath)!;
            if (originalFileCount <= 1) {
              totalPendingFiles.delete(message.testPath);
            } else {
              totalPendingFiles.set(message.testPath, originalFileCount - 1);
            }

            await hooks.on.fileFinished();

            if (testFileQueue.length > 0) {
              addAQueuedTestWorker(worker);
            }

            if (totalPendingFiles.size <= 0 && testFileQueue.length <= 0) {
              const end = new Date();
              const duration = end.getTime() - start.getTime();
              const results = { testResults, duration };
              
              const newFilesToAdd: Set<string> = new Set();
              for (const allFilesFinishedPromise of hooks.on.allFilesFinished(results)) {
                const filePathIterator = await allFilesFinishedPromise;
                for (const filePath of filePathIterator) {
                  newFilesToAdd.add(filePath);
                }
              }
              testFileQueue.push(...newFilesToAdd)

              if (testFileQueue.length <= 0) {
                await Promise.all(workers.map(worker => stopWorker(worker.process, {})));
                resolve(results);
              } else {
                addInitialTests();
              }
            }
            break;
          }
        }
      });
      worker.process.on('exit', code => {
        for (const otherWorker of workers) {
          if (otherWorker === worker) {
            continue;
          }
          // TODO: I believe otherWorker might cause this handler to be called yet again before the current handle finishes
          otherWorker.process.kill();
        }
        if (code !== 0) {
          reject(new Error('An error ocurred while running tests'));
        }
      });
    };

    for(const worker of workers) {
      setupWorkerHandle(worker);
    }
    addInitialTests();
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

  // TODO: Still need to add a scheduling algorithm
  const processCount = workers;

  const results: TesterResults = await runAndRecycleProcesses(
    tester,
    testMatch,
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
