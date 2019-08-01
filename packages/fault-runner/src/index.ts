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
import { join, resolve } from 'path';
import {
  TestHookOptions,
  PartialTestHookOptions,
  schema,
} from '@fault/addon-hook-schema';
import * as defaultReporter from './default-reporter';
import { cpus } from 'os';
import { readFile, writeFile } from 'mz/fs';

const addonEntryPath = require.resolve('./addon-entry');

type DurationData = {
  totalPendingDuration: number,
  pendingUnknownTestCount: number,
}
type WorkerInfo = {
  process: ChildProcess,
} & DurationData;
type InternalTestData = {
  testPath: string;
  estimatedDuration?: number;
}
type TestDurations = {
  [s: string]: number;
};


const isSmallestDuration = (worker: DurationData, workers: DurationData[]) => {
  if (worker.pendingUnknownTestCount > 0) {
    return !workers.some(otherWorker => otherWorker !== worker && otherWorker.pendingUnknownTestCount < worker.pendingUnknownTestCount);
  } else {
    return !workers.some(otherWorker => otherWorker !== worker && otherWorker.totalPendingDuration < worker.totalPendingDuration);
  }
};
const runAndRecycleProcesses = async (
  tester: string,
  testMatch: string | string[],
  processCount: number,
  setupFiles: string[],
  hooks: TestHookOptions,
  cwd: string = process.cwd(),
  env: { [s: string]: any },
  testerOptions = {},
  bufferCount: number,
): Promise<TesterResults> => {
  const startTime = Date.now();

  let globalTestId = 0;
  const testResults: Map<string, TestResult> = new Map();
  const forkForTest = (): ChildProcess =>
    fork(addonEntryPath, [tester, JSON.stringify(testerOptions), JSON.stringify(setupFiles)], {
      env,
      cwd,
      stdio: 'inherit',
    });

  // key -> internal test data
  const totalPendingFiles: Map<number, InternalTestData> = new Map();
  
  const testFileQueue: string[] = await globby(testMatch, { onlyFiles: true });

  const durationsPath = resolve(__dirname, '../durations-cache.json');
  const testDurations: TestDurations = await (async () => {
    try {
      const text = await readFile(durationsPath, 'utf8');
      const durationsJson: { [s: string]: number } = JSON.parse(text);
      return durationsJson;  
    } catch(err) {
      return {};
    }
  })();

  const resortFileQueue = () => {
    testFileQueue.sort((a, b) => {
      const aD = testDurations[a];
      const bD = testDurations[b];
      if (aD === bD) {
        return 0;
      } else if (aD === undefined) {
        return 1;
      } else if (bD === undefined) {
        return -1;
      } else if (aD < bD) {
        return -1;
      } else {
        return 1;
      } 
    })
  }

  resortFileQueue();

  const addTestsToWorker = (worker: WorkerInfo, testPaths: string[]) => {
    const testsToRun: RunTestData[] = [];
    for(const testPath of testPaths) {
      const duration = testDurations[testPath];
      if (duration === undefined) {
        worker.pendingUnknownTestCount++;
      } else {
        worker.totalPendingDuration += duration;
      }
      const key = globalTestId++;
      const externalTestData: RunTestData = {
        testPath,
        key,
      };
      const internalTestData: InternalTestData = {
        testPath,
        estimatedDuration: duration,
      };
      testsToRun.push(externalTestData);

      totalPendingFiles.set(key, internalTestData);
    }
    runTests(worker.process, { testsToRun });
  }

  const workers: WorkerInfo[] = [];
  for(let w = 0; w < processCount; w++)  {
    const worker: WorkerInfo = {
      process: forkForTest(),
      totalPendingDuration: 0,
      pendingUnknownTestCount: 0,
    };
    workers[w] = worker;
  }

  const workerFileQueueSize = bufferCount + 1;
  const addInitialTests = () => {
    const workerTests: ({ paths: string[] } & DurationData)[] = [];
    for(let w = 0; w < workers.length; w++) {
      workerTests[w] = { pendingUnknownTestCount: 0, totalPendingDuration: 0, paths: []};
    }
    let i = 0;
    while(testFileQueue.length > 0 && i < workerFileQueueSize) {
      let w = 0;
      while(testFileQueue.length > 0 && w < workers.length) {
        const workerTestInfo = workerTests[w];
        const testPath = isSmallestDuration(workerTestInfo, workerTests) ? testFileQueue.pop()! : testFileQueue.shift()!;
        const duration = testDurations[testPath];
        if (duration === undefined) {
          workerTestInfo.pendingUnknownTestCount++;
        } else {
          workerTestInfo.totalPendingDuration += duration;
        }
        workerTestInfo.paths.push(testPath);
        w++;
      }
      i++;
    }
    for(let w = 0; w < workers.length; w++) {
      addTestsToWorker(workers[w], workerTests[w].paths);
    }
  }

  const addAQueuedTestWorker = (worker: WorkerInfo) => {
    const testPath = isSmallestDuration(worker, workers) ? testFileQueue.pop()! : testFileQueue.shift()!;
    addTestsToWorker(worker, [testPath]);
  }

  return await new Promise((resolve, reject) => {
    const setupWorkerHandle = (worker: WorkerInfo) => {
      worker.process.on('message', async (message: ChildResult) => {
        switch (message.type) {
          case IPC.TEST: {
            testResults.set(message.key, message);
            await hooks.on.testResult(message);
            break;
          }
          case IPC.FILE_FINISHED: {
            const testData = totalPendingFiles.get(message.key)!;
            testDurations[testData.testPath] = message.duration;
            if (testData.estimatedDuration === undefined) {
              worker.pendingUnknownTestCount--;
            } else {
              worker.totalPendingDuration -= testData.estimatedDuration;
            }
            totalPendingFiles.delete(message.key);

            await hooks.on.fileFinished();

            if (testFileQueue.length > 0) {
              addAQueuedTestWorker(worker);
            }

            if (totalPendingFiles.size <= 0 && testFileQueue.length <= 0) {
              const endTime = Date.now();
              const totalDuration = endTime - startTime;
              const results: TesterResults = { testResults, duration: totalDuration };
              
              const newFilesToAdd: Set<string> = new Set();
              await writeFile(durationsPath, JSON.stringify(testDurations));
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
  testerOptions?: any,
  fileBufferCount?: number | null
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
  testerOptions,
  fileBufferCount = 2
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
    testerOptions,
    fileBufferCount === null ? Number.POSITIVE_INFINITY : fileBufferCount
  );

  await hooks.on.complete(results);

  return ![...results.testResults.values()].some(result => !result.passed);
};

export default run;
