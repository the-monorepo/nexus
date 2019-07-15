import { Coverage } from '@fault/istanbul-util';
import * as IPC from './ipc';
import * as Assertion from './assertion';
export { IPC, Assertion };

export type TesterResults = {
  testResults: Map<string, TestResult>;
  assertionResults: Map<string, AssertionFailureResult>;
  duration: number;
};

export type AssertionType = typeof Assertion.GENERIC;

type TypeHolder<T> = {
  type: T;
};
export type AssertionFailureData = {
  assertionType: typeof Assertion.GENERIC;
  file: string;
  key: string;
  expected: any;
  actual: any;
  message: any;
  stackFrames: any[];
};
export type AssertionFailureResult = AssertionFailureData &
  TypeHolder<typeof IPC.ASSERTION>;

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
  TypeHolder<typeof IPC.TEST>;

export type FileFinishedData = RunTestData;
export type FileFinishedResult = FileFinishedData & TypeHolder<typeof IPC.FILE_FINISHED>;
export type RunTestData = {
  filePath: string;
};
export type RunTestPayload = RunTestData & TypeHolder<typeof IPC.RUN_TEST>;
export type StopWorkerData = {};
export type StopWorkerResult = StopWorkerData & TypeHolder<typeof IPC.STOP_WORKER>;
export type ChildResult = TestResult | AssertionFailureResult | FileFinishedResult;
export type ParentResult = StopWorkerResult | RunTestPayload;
