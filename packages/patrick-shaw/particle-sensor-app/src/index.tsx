import * as cinder from 'cinder';

import { createPayload, createFailure } from '@resultful/result';

const requestUSB = async () => {
  const device = await navigator.usb.requestDevice({ filters: [] });

  await device.open();
  try {
    await device.selectConfiguration(1);
    await device.claimInterface(0);
  } catch(err) {
    await device.close();
    throw err
  }

  return device;
};

export type ParticleData = {
  PM_SP_UG_1_0: number;
  PM_SP_UG_2_5: number;
  PM_SP_UG_10_0: number;

  PM_AE_UG_1_0: number;
  PM_AE_UG_2_5: number;
  PM_AE_UG_10_0: number;
};

const UNSUCCESSFUL = Symbol('unsuccessful-reading');
const SUCCESSFUL = Symbol('successful-reading');
const ERROR = Symbol('error');

export type SuccessfulParticleReadingResult = {
  type: typeof SUCCESSFUL;
  dateTime: number;
  data: ParticleData;
  status: string;
  error: undefined;
};

export type UnsuccessfulParticleReadingResult = {
  type: typeof UNSUCCESSFUL;
  dateTime: number;
  data: undefined;
  status: string;
  error: undefined;
};

export type ErrorParticleReadingResult = {
  type: typeof ERROR;
  dateTime: number;
  data: undefined;
  status: undefined;
  error: any;
};

export type ParticleReadingResult =
  | SuccessfulParticleReadingResult
  | UnsuccessfulParticleReadingResult;
async function* foreverReadFromUSB(device): AsyncGenerator<ParticleReadingResult> {
  while (true) {
    try {
      const { data: dataView, status } = await device.transferIn(2, 64);
      const dateTimeReceivedReading = Date.now();

      if (status === 'ok') {
        const parsed: ParticleData = {
          PM_SP_UG_1_0: dataView.getUint16(0, true),
          PM_SP_UG_2_5: dataView.getUint16(2, true),
          PM_SP_UG_10_0: dataView.getUint16(4, true),

          PM_AE_UG_1_0: dataView.getUint16(6, true),
          PM_AE_UG_2_5: dataView.getUint16(8, true),
          PM_AE_UG_10_0: dataView.getUint16(10, true),
        };
        yield {
          type: SUCCESSFUL,
          dateTime: dateTimeReceivedReading,
          data: parsed,
          status,
          error: undefined,
        };
      } else {
        yield {
          type: UNSUCCESSFUL,
          dateTime: dateTimeReceivedReading,
          data: undefined,
          status,
          error: undefined,
        };
      }
    } catch (error) {
      yield {
        type: ERROR,
        dateTime: dateTimeReceivedReading,
        data: undefined,
        status: undefined,
        error
      }
    }
  }
}

const USBError = ({ error }) =>
  error !== undefined ? <section>{JSON.stringify(error, undefined, 2)}</section> : null;

const USBView = ({ device }) =>
  device !== undefined ? <section>Selected {device.productName}</section> : null;

class SensorPanelElement extends cinder.DomElement<any, any> {
  @cinder.rerender
  public readonly device;
  @cinder.rerender
  rerender() {}

  [cinder.MOUNT]() {
    this.data = [];
    (async () => {
      for await (const datum of foreverReadFromUSB(this.device)) {
        this.data.push(datum);
        this.rerender();
      }
    })();
  }

  render() {
    return (
      <section>
        <p>Selected {this.device.productName}</p>
        <p>{JSON.stringify(this.data)}</p>
      </section>
    );
  }
}
window.customElements.define('sensor-panel', SensorPanelElement);

let devices = new Set();
const onAddUSB = async () => {
  const device = await requestUSB();
  devices.add(device);
  rerender();
};

const App = () => (
  <main>
    <section>
      <button $$click={onAddUSB}>Add USB</button>
    </section>
    {[...devices].map(device => (
      <sensor-panel $device={device}/>
    ))}
  </main>
);

const rootElement = document.getElementById('root');
const rerender = () => cinder.render(<App />, rootElement);

rerender();
navigator.usb.addEventListener('connect', (event) => {
  usbDevices.add(event.device);
  rerender();
});

navigator.usb.addEventListener('disconnect', (event) => {
  usbDevices.delete(event.device);
  rerender();
});
