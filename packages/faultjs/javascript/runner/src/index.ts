// TODO: Remove console.log(...)s
import { fork, ForkOptions, ChildProcess } from 'child_process';

import { cpus } from 'os';
import { join, resolve } from 'path';
import { inspect } from 'util';

import globby from 'globby';
import { createCoverageMap } from 'istanbul-lib-coverage';

import {
  TestHookOptions,
  PartialTestHookOptions,
  schema,
} from '@fault/addon-hook-schema';
import { Coverage } from '@fault/istanbul-util';
import { ChildProcessWorkerClient } from '@fault/messages';
import {
  IPC,
  TestResult,
  ChildResult,
  TesterResults,
  FinalTesterResults,
  RunTestData,
  FileFinishedData,
} from '@fault/types';
import { readJson, writeJson } from '@pshaw/fs';

import * as defaultReporter from './default-reporter.ts';

const addonEntryPath = require.resolve('./addon-entry');

type DurationData = {
  totalPendingDuration: number;
  pendingUnknownTestCount: number;
};

type WorkerInfo = {
  expirationTimer: NodeJS.Timeout | undefined;
  client: ChildProcessWorkerClient;
  process: ChildProcess;
  workingOn: undefined | any;
} & DurationData;

type InternalTestData = {
  worker: WorkerInfo;
  testPath: string;
  estimatedDuration?: number;
};

type TestDurations = {
  [s: string]: number;
};

const isSmallestDuration = (worker: DurationData, workers: DurationData[]) => {
  if (worker.pendingUnknownTestCount > 0) {
    return !workers.some(
      (otherWorker) =>
        otherWorker !== worker &&
        otherWorker.pendingUnknownTestCount < worker.pendingUnknownTestCount,
    );
  } else {
    return !workers.some(
      (otherWorker) =>
        otherWorker !== worker &&
        otherWorker.totalPendingDuration < worker.totalPendingDuration,
    );
  }
};

const durationsPath = resolve(__dirname, '../durations-cache.json');
const readDurationsFile = async () => {
  try {
    const durationsJson: { [s: string]: number } = await readJson(durationsPath);
    return durationsJson;
  } catch (err) {
    return {};
  }
};

const forkForTest = (
  tester: string,
  testerOptions: any,
  setupFiles: string[],
  processOptions: ForkOptions,
): ChildProcess =>
  fork(
    addonEntryPath,
    [tester, JSON.stringify(testerOptions), JSON.stringify(setupFiles)],
    {
      stdio: 'inherit',
      ...processOptions,
    },
  );

const createFileComparer = (testDurations: TestDurations) => {
  return (a: string, b: string) => {
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
  };
};

const mergeCoverage = (workerCoverage: Coverage[]) => {
  const totalCoverage = createCoverageMap({});
  for (const coverage of workerCoverage) {
    totalCoverage.merge(createCoverageMap(coverage));
  }
  return totalCoverage;
};

type TestId = number;
const createStateClient = (
  testDurations: TestDurations,
  workers: WorkerInfo[],
  testFileQueue: string[],
  workerFileQueueSize: number,
) => {
  const pendingFiles: Map<TestId, InternalTestData> = new Map();
  let nextTestId = 0;

  const registerRunningTest = (worker: WorkerInfo, testPath: string) => {
    const id = nextTestId;
    const estimatedDuration = testDurations[id];

    if (estimatedDuration === undefined) {
      worker.pendingUnknownTestCount++;
    } else {
      worker.totalPendingDuration += estimatedDuration;
    }

    pendingFiles.set(id, {
      worker,
      estimatedDuration,
      testPath,
    });

    nextTestId++;
    console.log('register: ', testPath, pendingFiles.size);
    return id;
  };

  const deregisterRunningTest = (message: FileFinishedData) => {
    const testData = pendingFiles.get(message.key)!;

    testDurations[testData.testPath] = message.duration;
    if (testData.estimatedDuration === undefined) {
      testData.worker.pendingUnknownTestCount--;
    } else {
      testData.worker.totalPendingDuration -= testData.estimatedDuration;
    }
    pendingFiles.delete(message.key);
    console.log('deregister: ', message.testPath, pendingFiles.size);
  };

  const addTestsToWorker = (worker: WorkerInfo, testPaths: string[]) => {
    const testsToRun: RunTestData[] = [];
    for (const testPath of testPaths) {
      const key = registerRunningTest(worker, testPath);
      const externalTestData: RunTestData = {
        testPath,
        key,
      };
      testsToRun.push(externalTestData);
    }
    return worker.client.runTests({ testsToRun });
  };

  const isTestsPending = () => {
    return pendingFiles.size > 0;
  };

  const addAnotherTestToWorker = (worker: WorkerInfo) => {
    const testPath = isSmallestDuration(worker, workers)
      ? testFileQueue.pop()!
      : testFileQueue.shift()!;
    return addTestsToWorker(worker, [testPath]);
  };

  const addInitialTests = async () => {
    const workerTests: ({ paths: string[] } & DurationData)[] = workers.map(() => ({
      pendingUnknownTestCount: 0,
      totalPendingDuration: 0,
      paths: [],
    }));

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
    await Promise.all(
      workers.map((worker, w) => addTestsToWorker(worker, workerTests[w].paths)),
    );
  };

  return {
    addTestsToWorker,
    deregisterRunningTest,
    isTestsPending,
    addAnotherTestToWorker,
    addInitialTests,
  };
};

const createWorkers = (
  tester: string,
  testerOptions: any,
  setupFiles: string[],
  processOptions: ForkOptions,
  workerCount: number,
) => {
  const workers: WorkerInfo[] = [];
  for (let w = 0; w < workerCount; w++) {
    const childProcess = forkForTest(tester, testerOptions, setupFiles, processOptions);
    const worker: WorkerInfo = {
      expirationTimer: undefined,
      process: childProcess,
      client: new ChildProcessWorkerClient(childProcess),
      totalPendingDuration: 0,
      pendingUnknownTestCount: 0,
      workingOn: undefined,
    };
    workers[w] = worker;
  }
  return workers;
};

const runAndRecycleProcesses = async ({
  tester,
  testFiles,
  workerCount,
  setupFiles,
  hooks,
  processOptions,
  testerOptions,
  bufferCount,
  timeout,
}: InternalRunOptions): Promise<FinalTesterResults> => {
  const startTime = Date.now();

  const originalTestFiles: string[] = [];
  for await (const testFile of testFiles) {
    originalTestFiles.push(testFile);
  }
  const testFileQueue: string[] = [...originalTestFiles];

  const workerFileQueueSize = bufferCount + 1;

  const testDurations: TestDurations = await readDurationsFile();

  const fileComparer = createFileComparer(testDurations);
  const resortFileQueue = () => {
    testFileQueue.sort(fileComparer);
  };

  let firstResults: FinalTesterResults = null!;

  while (testFileQueue.length > 0) {
    resortFileQueue();
    const testResults: Map<string, TestResult> = new Map();

    const processCount = Math.min(workerCount, testFileQueue.length);

    const workers: WorkerInfo[] = createWorkers(
      tester,
      testerOptions,
      setupFiles,
      processOptions,
      processCount,
    );

    const pendingFileClient = createStateClient(
      testDurations,
      workers,
      testFileQueue,
      workerFileQueueSize,
    );

    const runningWorkers = new Set(workers);
    const workerCoverage: Coverage[] = [];
    let alreadyKillingWorkers = false;

    // TODO: This is getting way too messy. Clean this whole thing up. Needs to be much easier to understand
    const results = await new Promise<FinalTesterResults>((resolve, reject) => {
      const killWorkers = async (someWorkers: WorkerInfo[], err) => {
        if (alreadyKillingWorkers) {
          return;
        }
        alreadyKillingWorkers = true;
        console.log('Killing workers');
        for (const otherWorker of someWorkers) {
          clearTimeout(otherWorker.expirationTimer!);
          otherWorker.process.kill();
        }
        // TODO: DRY (see tester results creation above)
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        const results: FinalTesterResults = {
          testResults,
          duration: totalDuration,
          coverage: mergeCoverage(workerCoverage).data,
        };

        let shouldRerun = false;
        let allowed = false;
        for await (const { rerun, allow } of hooks.on.exit(results)) {
          if (rerun) {
            shouldRerun = true;
          }
          if (allow) {
            allowed = true;
          }
        }
        if (shouldRerun) {
          testFileQueue.push(...originalTestFiles);
          resolve(results);
        } else if (allowed) {
          console.log('allowing kill');
          resolve(results);
        } else {
          console.log('rejecting with kill');
          reject(err);
        }
      };
      const setupWorkerHandle = (worker: WorkerInfo, id: number) => {
        const replaceExpirationTimer = (worker: WorkerInfo) => {
          // TODO: Didn't actually check if clearTimeout(null) does anything weird
          clearTimeout(worker.expirationTimer!);
          worker.expirationTimer = setTimeout(() => {
            killWorkers(
              [...runningWorkers],
              new Error(
                `Worker ${id} took longer than ${timeout}ms. ${inspect(
                  worker.workingOn,
                  undefined,
                  undefined,
                  true,
                )}`,
              ),
            );
          }, timeout);
        };
        worker.process.on('message', async (candidateMessage: ChildResult) => {
          await worker.client.on(candidateMessage, async (message: ChildResult) => {
            switch (message.type) {
              case IPC.TEST: {
                testResults.set(message.data.key, message);
                await hooks.on.testResult(message);
                break;
              }
              case IPC.WORKING_ON_TEST:
                replaceExpirationTimer(worker);
                worker.workingOn = message.data;
                break;
              case IPC.STOPPED_WORKER: {
                console.log('stopped worker', id);
                clearTimeout(worker.expirationTimer!);
                workerCoverage.push(message.data.coverage);
                runningWorkers.delete(worker);
                //worker.process.kill();
                if (runningWorkers.size <= 0) {
                  console.log('finished test run');
                  const endTime = Date.now();
                  const totalDuration = endTime - startTime;

                  const totalCoverage = mergeCoverage(workerCoverage);

                  const finalResults: FinalTesterResults = {
                    coverage: totalCoverage.data,
                    testResults,
                    duration: totalDuration,
                  };
                  resolve(finalResults);
                }
                break;
              }
              case IPC.TEST_FILE: {
                console.log('files left in queue:', testFileQueue.length);
                pendingFileClient.deregisterRunningTest(message.data);

                await hooks.on.fileFinished();

                if (testFileQueue.length > 0) {
                  pendingFileClient.addAnotherTestToWorker(worker);
                }

                if (!pendingFileClient.isTestsPending() && testFileQueue.length <= 0) {
                  console.log('entered');
                  const endTime = Date.now();
                  const totalDuration = endTime - startTime;
                  const results: TesterResults = { testResults, duration: totalDuration };

                  const newFilesToAdd: Set<string> = new Set();
                  await writeJson(durationsPath, testDurations);
                  for await (const filePathIterator of hooks.on.allFilesFinished(
                    results,
                  )) {
                    if (filePathIterator === undefined || filePathIterator === null) {
                      continue;
                    }
                    for (const filePath of filePathIterator) {
                      newFilesToAdd.add(filePath);
                    }
                  }
                  testFileQueue.push(...newFilesToAdd);

                  await Promise.all(
                    workers.map((worker) => worker.client.stopWorker({})),
                  );
                }
                break;
              }
            }
          });
        });
        // TODO: Almost certain that, at the moment, there's a chance allFilesFinished and exit hooks both fire in the same round of testing
        worker.process.on('exit', (code, signal) => {
          console.log('worker exit', id, code, signal);
          clearTimeout(worker.expirationTimer!);
          if (signal === 'SIGTERM' && !runningWorkers.has(worker)) {
            return;
          }
          if (code !== 0 || runningWorkers.has(worker)) {
            const otherWorkers = [...runningWorkers].filter(
              (otherWorker) => otherWorker !== worker,
            );
            killWorkers(
              otherWorkers,
              new Error(
                `Something went wrong while running tests in worker ${id}. Received ${code} exit code and ${signal} signal. ${inspect(
                  worker.workingOn,
                  undefined,
                  undefined,
                  true,
                )}`,
              ),
            );
          }
        });
      };

      for (let w = 0; w < workers.length; w++) {
        setupWorkerHandle(workers[w], w);
      }

      pendingFileClient.addInitialTests();
    });

    if (firstResults === null) {
      firstResults = results;
    }
  }

  if (firstResults === null) {
    throw new Error('Something went wrong while running tests');
  }
  return firstResults;
};

export type RunOptions = {
  tester: string;
  testMatch: string | string[];
  setupFiles?: string[];
  addons?: PartialTestHookOptions[];
  reporters?: PartialTestHookOptions[];
  workers?: number;
  processOptions?: ForkOptions;
  testerOptions?: any;
  fileBufferCount?: number | null;
  timeout?: number;
};

type InternalRunOptions = {
  tester: string;
  testFiles: Iterable<string> | AsyncIterable<string>;
  workerCount: number;
  setupFiles: string[];
  hooks: TestHookOptions;
  processOptions: ForkOptions;
  testerOptions: any;
  bufferCount: number;
  timeout: number;
};

export const run = async ({
  tester,
  testMatch,
  setupFiles = [],
  addons = [],
  workers = cpus().length,
  processOptions: { cwd = process.cwd(), env = process.env, ...otherProcessOptions } = {},
  reporters = [defaultReporter.createPlugin({ dir: join(cwd, 'coverage') })],
  testerOptions = {},
  fileBufferCount = 4,
  timeout = 20000,
}: RunOptions) => {
  addons.push(...reporters);

  const hooks: TestHookOptions = schema.merge(addons);

  const processCount = workers;

  await hooks.on.start();

  const testFiles = await globby(testMatch, {
    onlyFiles: true,
    expandDirectories: false,
  });
  testFiles.sort();
  const internalOptions: InternalRunOptions = {
    tester: require.resolve(tester, {
      paths: [process.cwd()],
    }),
    testFiles,
    workerCount: processCount,
    setupFiles: setupFiles.map((path) =>
      require.resolve(path, {
        paths: [process.cwd()],
      }),
    ),
    hooks,
    processOptions: {
      cwd,
      env,
      ...otherProcessOptions,
    },
    testerOptions,
    bufferCount: fileBufferCount === null ? Number.POSITIVE_INFINITY : fileBufferCount,
    timeout,
  };
  const results: FinalTesterResults = await runAndRecycleProcesses(internalOptions);

  await hooks.on.complete(results);

  return ![...results.testResults.values()].some((result) => !result.data.passed);
};

export default run;
