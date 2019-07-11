import * as types from '@fault/addon-message-types';
import * as assertionTypes from '@fault/addon-message-types/src/assertion-types';
import { promisify } from 'util';
import { Coverage } from '@fault/istanbul-util';
import { ChildProcess } from 'child_process';
type TypeHolder<T> = {
  type: T;
};
export type AssertionFailureData = {
  assertionType: typeof assertionTypes.GENERIC,
  file: string;
  key: string;
  expected: any;
  actual: any;
  message: any;
};
export type AssertionFailureResult = AssertionFailureData & TypeHolder<typeof types.ASSERTION>;

export type TestData = {
  key: string;
  titlePath: string[];
  duration: number;
  file: string;
  coverage: Coverage;
};

export type PassingTestData = {
  passed: true;
} & TestData;

export type FailingTestData = {
  passed: false;
  stack: any;
} & TestData;

export type TestResult = (PassingTestData | FailingTestData) &
  TypeHolder<typeof types.TEST>;

const promiseSend: (param: any) => Promise<unknown> =
  process.send !== undefined ? promisify(process.send!.bind(process)) : undefined!;
export const submitAssertionResult = (data: AssertionFailureData) => {
  const result: AssertionFailureResult = {
    ...data,
    type: types.ASSERTION,
  };

  return promiseSend!(result);
};

export const submitTestResult = async (data: PassingTestData | FailingTestData) => {
  const result: TestResult = {
    ...data,
    type: types.TEST,
  };

  return await promiseSend!(result);
};

type FileFinishedData = RunTestData;
type FileFinishedResult = FileFinishedData & TypeHolder<typeof types.FILE_FINISHED>;
export const submitFileResult = (data: FileFinishedData) => {
  const result: FileFinishedResult = {
    ...data,
    type: types.FILE_FINISHED,
  };
  return promiseSend(result);
};

const promiseWorkerSend = (worker: ChildProcess, data: any) => {
  return new Promise((resolve, reject) => {
    worker.send(data, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
export type RunTestData = {
  filePath: string;
};
export type RunTestPayload = RunTestData & TypeHolder<typeof types.RUN_TEST>;
export const runTest = (worker: ChildProcess, data: RunTestData) => {
  const result: RunTestPayload = {
    type: types.RUN_TEST,
    ...data,
  };
  return promiseWorkerSend(worker, result);
};

export type StopWorkerData = {};
export type StopWorkerResult = StopWorkerData & TypeHolder<typeof types.STOP_WORKER>;
export const stopWorker = (worker: ChildProcess, data: StopWorkerData) => {
  const result: StopWorkerResult = {
    type: types.STOP_WORKER,
    ...data,
  };
  return promiseWorkerSend(worker, result);
};

export type ChildResult = TestResult | AssertionFailureResult | FileFinishedResult;
export type ParentResult = StopWorkerResult | RunTestPayload;
