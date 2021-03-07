import * as cinder from 'cinder';

import { createPayload, createFailure } from '@resultful/result';

import { TimeLineChartElement } from './TimeLineChartElement';
import { SensorPanelElement } from './SensorPanelElement';

import styles from './index.scss';
window.customElements.define('time-line-chart', TimeLineChartElement);

const requestUSB = async () => {
  const device = await navigator.usb.requestDevice({ filters: [] });

  await device.open();
  try {
    await device.selectConfiguration(1);
    await device.claimInterface(0);
  } catch (err) {
    await device.close();
    throw err;
  }

  return device;
};

const USBError = ({ error }) =>
  error !== undefined ? <section>{JSON.stringify(error, undefined, 2)}</section> : null;

const USBView = ({ device }) =>
  device !== undefined ? <section>Selected {device.productName}</section> : null;

window.customElements.define('sensor-panel', SensorPanelElement);

const onMockAddUSB = async () => {
  let transferInCallCount = 0;
  const mockUSBDevice = {
    productName: 'mock device',
    transferIn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const dataView = new DataView(new ArrayBuffer(12));
      const isEven = transferInCallCount % 2 === 0;
      dataView.setInt16(0, isEven ? 0 : 1);
      dataView.setInt16(2, isEven ? 2 : 3);
      dataView.setInt16(4, isEven ? 4 : 5);
      dataView.setInt16(6, isEven ? 6 : 7);
      dataView.setInt16(8, isEven ? 8 : 9);
      dataView.setInt16(10, isEven ? 10 : 11);

      transferInCallCount++;

      return { data: dataView, status: 'ok' };
    },
  };
  devices.add(mockUSBDevice);
  rerender();
};

let devices = new Set();
const onAddUSB = async () => {
  const device = await requestUSB();
  devices.add(device);
  rerender();
};

const App = () => (
  <main class={styles.locals.main}>
    <style>{styles.toString()}</style>
    <section>
      <button $$click={onAddUSB}>Add USB</button>
      <button $$click={onMockAddUSB}>Add Mock USB</button>
    </section>
    <section class={styles.locals.devices}>
      {[...devices].map((device) => (
        <sensor-panel $device={device} />
      ))}
    </section>
  </main>
);

const rootElement = document.getElementById('root');
const rerender = () => cinder.render(<App />, rootElement);

rerender();
navigator.usb.addEventListener('connect', (event) => {
  devices.add(event.device);
  rerender();
});

navigator.usb.addEventListener('disconnect', (event) => {
  devices.delete(event.device);
  rerender();
});
