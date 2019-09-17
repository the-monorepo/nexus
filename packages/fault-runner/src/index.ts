import globby from 'globby';
import { fork, ChildProcess } from 'child_process';
import { createCoverageMap } from 'istanbul-lib-coverage';

import {
  IPC,
  TestResult,
  ChildResult,
  TesterResults,
  FinalTesterResults,
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
import { Coverage } from '@fault/istanbul-util';

const addonEntryPath = require.resolve('./addon-entry');

type DurationData = {
  totalPendingDuration: number;
  pendingUnknownTestCount: number;
};
type WorkerInfo = {
  expirationTimer: NodeJS.Timeout | null;
  process: ChildProcess;
} & DurationData;
type InternalTestData = {
  testPath: string;
  estimatedDuration?: number;
};
type TestDurations = {
  [s: string]: number;
};

const isSmallestDuration = (worker: DurationData, workers: DurationData[]) => {
  if (worker.pendingUnknownTestCount > 0) {
    return !workers.some(
      otherWorker =>
        otherWorker !== worker &&
        otherWorker.pendingUnknownTestCount < worker.pendingUnknownTestCount,
    );
  } else {
    return !workers.some(
      otherWorker =>
        otherWorker !== worker &&
        otherWorker.totalPendingDuration < worker.totalPendingDuration,
    );
  }
};
const runAndRecycleProcesses = async (
  tester: string,
  testMatch: string | string[],
  workerCount: number,
  setupFiles: string[],
  hooks: TestHookOptions,
  cwd: string = process.cwd(),
  env: { [s: string]: any },
  testerOptions = {},
  bufferCount: number,
  timeout: number
): Promise<FinalTesterResults> => {
  console.log();
  const startTime = Date.now();

  let globalTestId = 0;
  const testResults: Map<string, TestResult> = new Map();
  const forkForTest = (): ChildProcess =>
    fork(
      addonEntryPath,
      [tester, JSON.stringify(testerOptions), JSON.stringify(setupFiles)],
      {
        env,
        cwd,
        stdio: 'inherit',
      },
    );

  // key -> internal test data
  const totalPendingFiles: Map<number, InternalTestData> = new Map();
  const testFileQueue: string[] = await globby(testMatch, { onlyFiles: true });
  
  const processCount = Math.min(workerCount, testFileQueue.length);

  const durationsPath = resolve(__dirname, '../durations-cache.json');
  const testDurations: TestDurations = await (async () => {
    try {
      const text = await readFile(durationsPath, 'utf8');
      const durationsJson: { [s: string]: number } = JSON.parse(text);
      return durationsJson;
    } catch (err) {
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
    });
  };

  resortFileQueue();

  const addTestsToWorker = (worker: WorkerInfo, testPaths: string[]) => {
    const testsToRun: RunTestData[] = [];
    for (const testPath of testPaths) {
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
  };

  const workers: WorkerInfo[] = [];
  for (let w = 0; w < processCount; w++) {
    const worker: WorkerInfo = {
      expirationTimer: null,
      process: forkForTest(),
      totalPendingDuration: 0,
      pendingUnknownTestCount: 0,
    };
    workers[w] = worker;
  }

  const workerFileQueueSize = bufferCount + 1;
  const addInitialTests = () => {
    const workerTests: ({ paths: string[] } & DurationData)[] = [];
    for (let w = 0; w < workers.length; w++) {
      workerTests[w] = { pendingUnknownTestCount: 0, totalPendingDuration: 0, paths: [] };
    }
    let i = 0;
    while (testFileQueue.length > 0 && i < workerFileQueueSize) {
      let w = 0;
      while (testFileQueue.length > 0 && w < workers.length) {
        const workerTestInfo = workerTests[w];
        const testPath = isSmallestDuration(workerTestInfo, workerTests)
          ? testFileQueue.pop()!
          : testFileQueue.shift()!;
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
    for (let w = 0; w < workers.length; w++) {
      addTestsToWorker(workers[w], workerTests[w].paths);
    }
  };

  const runningWorkers = new Set(workers);

  const getTotalCoverage = () =>{
    const totalCoverage = createCoverageMap({});
    for (const coverage of workerCoverage) {
      totalCoverage.merge(coverage);
    }
    return totalCoverage;
  }

  const addAQueuedTestWorker = (worker: WorkerInfo) => {
    const testPath = isSmallestDuration(worker, workers)
      ? testFileQueue.pop()!
      : testFileQueue.shift()!;
    addTestsToWorker(worker, [testPath]);
  };
  const workerCoverage: Coverage[] = [];
  // TODO: This is getting way too messy. Clean this whole thing up. Needs to be much easier to understand
  let alreadyRerunTests = false;
  return await new Promise((resolve, reject) => {
    const killWorkers = async (someWorkers: WorkerInfo[], err) => {
      console.log('Killing workers');
      for (const otherWorker of someWorkers) {
        clearTimeout(otherWorker.expirationTimer!);
        otherWorker.process.kill();
      }
      // TODO: DRY (see tester results creation above)
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const results: TesterResults = { testResults, duration: totalDuration };

      let shouldRerun = false;
      let allowed = false;
      for await(const { rerun, allow } of hooks.on.exit(results)) {
        if (rerun) {
          shouldRerun = true;
        }
        if (allow) {
          allowed = true;
        }
      }
      if (shouldRerun) {
        if (alreadyRerunTests) {
          reject(new Error('Tests have already been rerun'));
        }
        console.log('rerunning')
        const nestedFinalResults = await runAndRecycleProcesses(tester, testMatch, workerCount, setupFiles, hooks, cwd, env, testerOptions, bufferCount, timeout);
        alreadyRerunTests = true;
        resolve(nestedFinalResults);    
      } else if(allowed) {
        console.log('allowing kill');
        resolve({ ...results, coverage: getTotalCoverage() });
      } else {
        console.log('rejecting with kill')
        reject(err);
      }
    }

    const setupWorkerHandle = (worker: WorkerInfo, id: number) => {
      const replaceExpirationTimer = (worker: WorkerInfo) => {
        // TODO: Didn't actually check if clearTimeout(null) does anything weird
        clearTimeout(worker.expirationTimer!);
        worker.expirationTimer = setTimeout(() => {
          console.log('timeout', id)
          killWorkers(workers.filter(otherWorker => otherWorker !== worker), new Error(`Worker ${id} took longer than ${timeout}ms.`));
        }, timeout);
      }
      replaceExpirationTimer(worker);
      worker.process.on('message', async (message: ChildResult) => {
        switch (message.type) {
          case IPC.TEST: {
            replaceExpirationTimer(worker);
            testResults.set(message.key, message);
            await hooks.on.testResult(message);
            break;
          }
          case IPC.STOPPED_WORKER: {
            console.log('stopped worker', id)
            clearTimeout(worker.expirationTimer!);
            workerCoverage.push(message.coverage);
            runningWorkers.delete(worker);
            if (runningWorkers.size <= 0) {
              console.log('finished test run');
              const endTime = Date.now();
              const totalDuration = endTime - startTime;

              const totalCoverage = getTotalCoverage();

              const finalResults: FinalTesterResults = {
                coverage: totalCoverage,
                testResults,
                duration: totalDuration,
              };

              if (testFileQueue.length > 0) {
                if (alreadyRerunTests) {
                  reject(new Error('Tests have already been rerun'));
                }
                // TODO: Would probably run into a stack overflow if you rerun tests too many times
                console.log(testFileQueue);
                const nestedFinalResults = await runAndRecycleProcesses(tester, [...testFileQueue], workerCount, setupFiles, hooks, cwd, env, testerOptions, bufferCount, timeout);                
                alreadyRerunTests = true;
                resolve(nestedFinalResults);
              } else {
                resolve(finalResults);
              }
            }
            break;
          }
          case IPC.FILE_FINISHED: {
            console.log('files left in queue:', testFileQueue.length);
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
              for await (const filePathIterator of hooks.on.allFilesFinished(results)) {
                if (filePathIterator === undefined || filePathIterator === null) {
                  continue;
                }
                for (const filePath of filePathIterator) {
                  newFilesToAdd.add(filePath);
                }
              }
              testFileQueue.push(...newFilesToAdd);

              await Promise.all(workers.map(worker => stopWorker(worker.process, {})));
            }
            break;
          }
        }
      });
      // TODO: Almost certain that, at the moment, there's a chance allFilesFinished and exit hooks both fire in the same round of testing
      worker.process.on('exit', (code, signal)=> {
        console.log('worker exit', id, code, signal);
        const otherWorkers = workers.filter(otherWorker => otherWorker !== worker);
        if (code !== 0) {
          console.log('killing cause bad code', code, 'worker', id);
          killWorkers(otherWorkers, new Error(`Something went wrong while running tests in worker ${id}. Received ${code} exit code and ${signal} signal.`));
        }
      });
    };

    for (let w = 0; w < workers.length; w++) {
      setupWorkerHandle(workers[w], w);
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
  env?: { [s: string]: any };
  testerOptions?: any;
  fileBufferCount?: number | null;
  timeout?: number
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
  fileBufferCount = 2,
  timeout = 20000
}: RunOptions) => {
  addons.push(...reporters);

  const hooks: TestHookOptions = schema.merge(addons);

  const processCount = workers;

  await hooks.on.start();

  const results: FinalTesterResults = await runAndRecycleProcesses(
    tester,
    testMatch,
    processCount,
    setupFiles,
    hooks,
    cwd,
    env,
    testerOptions,
    fileBufferCount === null ? Number.POSITIVE_INFINITY : fileBufferCount,
    timeout
  );

  await hooks.on.complete(results);

  return ![...results.testResults.values()].some(result => !result.passed);
};

export default run;
