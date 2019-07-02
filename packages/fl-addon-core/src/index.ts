import * as types from 'fl-addon-message-types';
import { promisify } from 'util';
interface TypeHolder<T> {
  type: T;
}
export interface AssertionData {
  passed: boolean;
  coverage: any;
}
type AssertionResult = AssertionData & TypeHolder<typeof types.ASSERTION>;

export interface TestData {
  fullTitle: any;
  passed: boolean;
  coverage: any;
}
type TestResult = TestData & TypeHolder<typeof types.TEST>;

export interface ExecutionData {}
type ExecutionResult = ExecutionData & TypeHolder<typeof types.EXECUTION>;

const promiseSend: (param: any) => Promise<unknown> = promisify(process.send!);
export const submitAssertionResult = (data: AssertionData) => {
  const result: AssertionResult = {
    ...data,
    type: types.ASSERTION,
  };

  return promiseSend!(result);
};

export const submitTestResult = (data: TestData) => {
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
