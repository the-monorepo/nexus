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

export class ManagerClient {
  private currentOrderId = 0;
  private readonly promiseSend: (...args: any) => Promise<any>;
  constructor() {
    this.promiseSend = promisify(process.send!.bind(process));
  }

  send(type: string, data: any) {
    const id = this.currentOrderId++;
    return this.promiseSend({
      type,
      id,
      data,
    });
  }

  submitTestResult (data: PassingTestData | FailingTestData) {
    return this.send(IPC.TEST, data);
  };
  
  submitFileResult(data: FileFinishedData) {
    return this.send(IPC.TEST_FILE, data);
  };
  
  stoppedWorker(data: StoppedWorkerData) {
    return this.send(IPC.STOPPED_WORKER, data);
  };  
}
