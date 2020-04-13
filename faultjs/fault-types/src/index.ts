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
  coverage: Coverage;
} & TesterResults;

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
  stack: string | null;
} & TestData;

export type TestResult = Payload<typeof IPC.TEST, PassingTestData | FailingTestData>;

export type Payload<T, D> = {
  type: T;
  id: number;
  data: D;
};
export type FileFinishedResult = Payload<typeof IPC.TEST_FILE, FileFinishedData>;
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
export type RunTestsPayload = Payload<typeof IPC.TEST_FILE, RunTestsData>;

export type StopWorkerData = {};
export type StopWorkerResult = Payload<typeof IPC.STOP_WORKER, StopWorkerData>;

export type StoppedWorkerData = {
  coverage: Coverage;
};
export type StoppedWorkerResult = Payload<typeof IPC.STOPPED_WORKER, StoppedWorkerData>;

export type ChildResult = TestResult | FileFinishedResult | StoppedWorkerResult;
export type ParentResult = StopWorkerResult | RunTestsPayload;
