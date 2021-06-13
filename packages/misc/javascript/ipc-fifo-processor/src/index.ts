import Heap from '@pshaw/keyed-binary-heap';

export type OnPayloadCallback<T> = (data: T) => Promise<any>;

class IPCFIFOProcessor<T> {
  private waitingForId = 0;
  private payloadQueue: Heap<any> = new Heap((a, b) => b.id - a.id);
  private running = false;

  on(data: T, on) {
    this.payloadQueue.push(data);
    if (this.running) {
      return;
    }
    this.running = true;

    return this.runPayloads(on);
  }

  private async runPayloads(on) {
    while (
      this.payloadQueue.length > 0 &&
      this.payloadQueue.peek().id === this.waitingForId
    ) {
      const payload = this.payloadQueue.pop();

      await on(payload);
      this.waitingForId++;
    }

    this.running = false;
  }
}

export default IPCFIFOProcessor;
