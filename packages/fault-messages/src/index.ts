import {
  IPC,
  PassingTestData,
  FailingTestData,
  TestResult,
  FileFinishedData,
  FileFinishedResult,
  RunTestsPayload,
  StoppedWorkerData,
  StopWorkerData,
  StopWorkerResult,
  RunTestsData,
} from '@fault/types';
import { promisify } from 'util';
import { ChildProcess } from 'child_process';

const promiseSend: (...arg: any) => Promise<any> =
  process.send !== undefined ? promisify(process.send!.bind(process)) : undefined!;

export const submitTestResult = async (data: PassingTestData | FailingTestData) => {
  const result: TestResult = {
    ...data,
    type: IPC.TEST,
  };

  return await promiseSend!(result);
};

export const submitFileResult = (data: FileFinishedData) => {
  const result: FileFinishedResult = {
    ...data,
    type: IPC.FILE_FINISHED,
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

export const runTests = (worker: ChildProcess, data: RunTestsData) => {
  const result: RunTestsPayload = {
    type: IPC.RUN_TEST,
    ...data,
  };
  return promiseWorkerSend(worker, result);
};

export const stopWorker = (worker: ChildProcess, data: StopWorkerData) => {
  const result: StopWorkerResult = {
    type: IPC.STOP_WORKER,
    ...data,
  };
  return promiseWorkerSend(worker, result);
};

export const stoppedWorker = (data: StoppedWorkerData) => {
  return promiseSend({
    type: IPC.STOPPED_WORKER,
    ...data
  });
}