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

let device: undefined | any;

async function* timerThing() {
  let v = 0;
  while(true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    yield v++;
  }
}

const timerIterator = timerThing();

const App = () => (
  <main>
    TODO
    <div watch_$textContent={timerIterator} />
    <form>
      <label htmlFor="first-pulse-duration">First pulse duration</label>
      <input type="range" name="first-pulse-duration" />
      <label htmlFor="pulse-gap">Pulse gap</label>
      <input type="range" name="pulse-gap" />
      <label htmlFor="second-pulse-duration">Second pulse duration</label>
      <input type="range" name="second-pulse-duration" />
    </form>
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
