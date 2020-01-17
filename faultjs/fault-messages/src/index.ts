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
  private currentOrderId: number = 0;
  constructor(
    private readonly childProcess: ChildProcess,
  ) {

  }

  send(type: string, data: any): Promise<any> {
    const id = this.currentOrderId++;
    return new Promise((resolve, reject) => {
      this.childProcess.send({
        type,
        id,
        data,
      }, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };  

  runTests(data: RunTestsData) {
    return this.send(IPC.TEST_FILE, data);
  };
  
  stopWorker(data: StopWorkerData) {
    return this.send(IPC.STOP_WORKER, data);
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
    type: IPC.TEST_FILE,
  };
  return promiseSend(result);
};

export const stoppedWorker = (data: StoppedWorkerData) => {
  return promiseSend({
    type: IPC.STOPPED_WORKER,
    ...data,
  });
};
