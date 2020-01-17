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

export class ChildProcessWorkerClient {
  constructor(private readonly childProcess: ChildProcess) {

  }

  send(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.childProcess.send(data, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };  

  runTests(data: RunTestsData) {
    const result: RunTestsPayload = {
      type: IPC.RUN_TEST,
      ...data,
    };
    return this.send(result);
  };
  
  stopWorker(data: StopWorkerData) {
    const result: StopWorkerResult = {
      type: IPC.STOP_WORKER,
      ...data,
    };
    return this.send(result);
  };
  
}
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

export const stoppedWorker = (data: StoppedWorkerData) => {
  return promiseSend({
    type: IPC.STOPPED_WORKER,
    ...data,
  });
};
