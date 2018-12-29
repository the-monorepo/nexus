import { ChildProcess } from 'child_process';
import { promisify } from 'util';

import {
  IPC,
  PassingTestData,
  FailingTestData,
  FileFinishedData,
  StoppedWorkerData,
  StopWorkerData,
  NoMoreTestsForWorkerData,
  TestTakingTooLongData,
  WorkingOnTestData,
  RunTestsData,
} from '@fault/types';

import IPCFIFOProcessor from 'ipc-fifo-processor';

export class ChildProcessWorkerClient {
  private currentOrderId = 0;
  private serializer = new IPCFIFOProcessor();
  constructor(private readonly childProcess: ChildProcess) {}

  on(data, on) {
    return this.serializer.on(data, on);
  }

  send(type: string, data: any): Promise<any> {
    const id = this.currentOrderId++;
    return new Promise((resolve, reject) => {
      this.childProcess.send(
        {
          type,
          id,
          data,
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }

  runTests(data: RunTestsData) {
    return this.send(IPC.TEST_FILE, data);
  }

  stopWorker(data: StopWorkerData) {
    return this.send(IPC.STOP_WORKER, data);
  }

  notifyWorkerThatTheresNoMoreTestsForIt(data: NoMoreTestsForWorkerData) {
    return this.send(IPC.NO_MORE_TESTS_FOR_WORKER, data);
  }

  testTakingTooLong(data: TestTakingTooLongData) {
    return this.send(IPC.TEST_TAKING_TOO_LONG, data);
  }
}

export class ManagerClient {
  private currentOrderId = 0;
  private serializer = new IPCFIFOProcessor();
  private readonly promiseSend: (...args: any) => Promise<any>;

  constructor() {
    this.promiseSend = promisify(process.send!.bind(process));
  }

  on(data, on) {
    return this.serializer.on(data, on);
  }

  send(type: string, data: any) {
    const id = this.currentOrderId++;
    return this.promiseSend({
      type,
      id,
      data,
    });
  }

  submitTestResult(data: PassingTestData | FailingTestData) {
    return this.send(IPC.TEST, data);
  }

  submitFileResult(data: FileFinishedData) {
    return this.send(IPC.TEST_FILE, data);
  }

  stoppedWorker(data: StoppedWorkerData) {
    return this.send(IPC.STOPPED_WORKER, data);
  }

  notifyWorkingOnTest(data: WorkingOnTestData) {
    return this.send(IPC.WORKING_ON_TEST, data);
  }
}
