import * as cinder from 'cinder';

import styles from './index.scss';

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

const device: undefined | any;

const App = () => (
  <main>
    TODO
  </main>
);

const rootElement = document.getElementById('root');
const rerender = () => cinder.render(<App />, rootElement);

rerender();
navigator.usb.addEventListener('connect', (event) => {
  device = event.device;
  rerender();
});

navigator.usb.addEventListener('disconnect', (event) => {
  device = event.device;
  rerender();
});
