import { Coverage } from '@fault/istanbul-util';
import * as IPC from './ipc';
export { IPC };
export type Stats = {
  failed: number;
  passed: number;
};

export type TesterResults = {
  testResults: Map<string, TestResult>;
  duration: number;
};

export type FinalTesterResults = {
  coverage: Coverage
} & TesterResults;

type TypeHolder<T> = {
  type: T;
};
export type TestData = {
  key: string;
  titlePath: string[];
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

export type FileFinishedResult = FileFinishedData & TypeHolder<typeof IPC.FILE_FINISHED>;
export type RunTestData = {
  testPath: string;
  key: any;
};
export type FileFinishedData = RunTestData & {
  duration: number;
};

export type RunTestsData = {
  testsToRun: RunTestData[];
};
export type RunTestsPayload = RunTestsData & TypeHolder<typeof IPC.RUN_TEST>;

export type StopWorkerData = {};
export type StopWorkerResult = StopWorkerData & TypeHolder<typeof IPC.STOP_WORKER>;

export type StoppedWorkerData = {
  coverage: Coverage;
};
export type StoppedWorkerResult = StoppedWorkerData & TypeHolder<typeof IPC.STOPPED_WORKER>;

export type ChildResult = TestResult | FileFinishedResult | StoppedWorkerResult;
export type ParentResult = StopWorkerResult | RunTestsPayload;
