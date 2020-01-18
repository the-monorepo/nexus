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
import Heap from '@pshaw/binary-heap';
import { promisify } from 'util';
import { ChildProcess } from 'child_process';

export class IPCSerializer {
  private waitingForId: number = 0;
  private payloadQueue: Heap<any> = new Heap((a, b) => b.id - a.id);
  private running: boolean = false;

  on(data, on) {
    this.payloadQueue.push(data);
    if (this.running) {
      return;
    }    
    this.running = true;

    return this.runPayloads(on);
  }

  private async runPayloads(on) {
    while(this.payloadQueue.length > 0 && this.payloadQueue.peek().id === this.waitingForId) {
      const payload = this.payloadQueue.pop();
      
      await on(payload);
      this.waitingForId++;
    }

    this.running = false;    
  }
}

export class ChildProcessWorkerClient {
  private currentOrderId: number = 0;
  private serializer = new IPCSerializer();
  constructor(
    private readonly childProcess: ChildProcess
  ) {}

  on(data, on) {
    return this.serializer.on(data, on);
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
  private serializer = new IPCSerializer();
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
