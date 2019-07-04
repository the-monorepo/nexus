import * as types from 'fl-addon-message-types';
import { promisify } from 'util';
type TypeHolder<T> = {
  type: T;
};
export type AssertionData = {
  passed: boolean;
  coverage: any;
};
export type AssertionResult = AssertionData & TypeHolder<typeof types.ASSERTION>;

export type TestData = {
  fullTitle: any;
  hash: string;
  duration: number;
  file: string;
  coverage: any;
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

export type ExecutionData = {
  passed: boolean;
};
export type ExecutionResult = ExecutionData & TypeHolder<typeof types.EXECUTION>;

const promiseSend: (param: any) => Promise<unknown> = promisify(
  process.send!.bind(process),
);
export const submitAssertionResult = (data: AssertionData) => {
  const result: AssertionResult = {
    ...data,
    type: types.ASSERTION,
  };

  return promiseSend!(result);
};

export const submitTestResult = (data: PassingTestData | FailingTestData) => {
  const result: TestResult = {
    ...data,
    type: types.TEST,
  };

  return promiseSend!(result);
};

export const submitExecutionResult = (data: ExecutionData) => {
  const result: ExecutionResult = {
    ...data,
    type: types.EXECUTION,
  };

  return promiseSend!(result);
};
