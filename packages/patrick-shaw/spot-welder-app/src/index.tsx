import * as cinder from 'cinder';

import callbackGenerator from 'callback-to-async-iterable';

import styles from './index.scss';

const requestUSB = async () => {
  const device = await navigator.usb.requestDevice({ filters: [] });
  return device;
};

const claimUSB = async (device) => {
  await device.open();
  try {
    console.log(device);
    await device.selectConfiguration(1);
    await device.claimInterface(0);
  } catch (err) {
    await device.close();
    throw err;
  }
};

let selectedDevice: undefined | any;
let transferring = false;

const devices = callbackGenerator<[any]>();

(async () => {
  try {
    const initialDevices = await navigator.usb.getDevices();
    if (initialDevices.length >= 1) {
      selectedDevice = initialDevices[0];
      await claimUSB(selectedDevice);
      console.log('test...');
      while(true) {
        console.log((await selectedDevice.transferIn(2, 64)).data.getUint8(0, true));
      }
      rerender();
    }
  } catch(err) {
    console.error(err);
  }

  for await(const [device] of devices) {
    try {
      await claimUSB(device);
      selectedDevice = device;
      rerender();
    } catch(err) {
      console.error(err);
    }
  }
})();

const onSelectUsbClick = async (event) => {
  const device = await requestUSB();
  devices.callback(device);
};

const onDisconnectUsbClick = async (event) => {
  console.log(selectedDevice);
  if (selectedDevice === undefined) {
    return;
  }

  await selectedDevice.close();
  selectedDevice = undefined;
  rerender();
};

const UsbSelection = ({ device }) => (
  <section>
    <button $$click={onSelectUsbClick}>
      Select USB
    </button>
    <button $$click={onDisconnectUsbClick}>
      Disconnect
    </button>
    {device === undefined ? undefined : `Selected ${device.productName}`}
  </section>
);

export type RangeSliderProps = {
  name: string;
  children: any;
  min: number;
  max: number;
  step: number;
  currentDuration: AsyncIterable<number>;
};

export const RangeSlider = ({
  children,
  currentDuration,
  ...other
}: RangeSliderProps) => (
  <>
    <label class={styles.locals.rangeLabel}>
      {children}
      <div class={styles.locals.inputContainer}>
        <input type="range" class={styles.locals.rangeInput} {...other} />
        <span watch_$textContent={currentDuration} />
      </div>
    </label>
  </>
);

async function* eventsToValueByName(events: AsyncIterable<Event>, name: string) {
  for await (const [e] of events) {
    if (e.target.name === name) {
      yield e.target.value;
    }
  }
}

// TODO: If state was scoped to RangeSlider, woudln't need this
async function* withDefault(iterable: AsyncIterable<T>, defaultValue: T) {
  yield defaultValue;
  yield* iterable;
}

const formInputs = callbackGenerator<[Event]>();

const FIRST_PULSE_DURATION_DEFAULT = 60;
const FIRST_PULSE_DURATION_NAME = 'firstPulseDuration';

const PULSE_GAP_DURATION_DEFAULT = 30;
const PULSE_GAP_DURATION_NAME = 'pulseGapDuration';

const SECOND_PULSE_DURATION_DEFAULT = 120;
const SECOND_PULSE_DURATION_NAME = 'secondPulseDuration';

const firstPulseDurations = withDefault(
  eventsToValueByName(formInputs, FIRST_PULSE_DURATION_NAME),
  FIRST_PULSE_DURATION_DEFAULT,
);
const pulseGapDurations = withDefault(
  eventsToValueByName(formInputs, PULSE_GAP_DURATION_NAME),
  PULSE_GAP_DURATION_DEFAULT,
);
const secondPulseDurations = withDefault(
  eventsToValueByName(formInputs, SECOND_PULSE_DURATION_NAME),
  SECOND_PULSE_DURATION_DEFAULT,
);

const submissions = callbackGenerator<[Event]>();
(async () => {
  for await (const [e] of submissions) {
    console.log('submitting...');
    transferring = true;
    rerender();
    e.preventDefault();

    try {
      const formData = new FormData(e.target);

      const firstPulseDuration = Number.parseInt(formData.get(FIRST_PULSE_DURATION_NAME));
      const pulseGapDuration = Number.parseInt(formData.get(PULSE_GAP_DURATION_NAME));
      const secondPulseDuration = Number.parseInt(
        formData.get(SECOND_PULSE_DURATION_NAME),
      );

      const transferOutDataView = new DataView(new ArrayBuffer(12));
      transferOutDataView.setUint16(0, firstPulseDuration, true);
      transferOutDataView.setUint16(2, firstPulseDuration, true);
      transferOutDataView.setUint16(4, pulseGapDuration, true);
      transferOutDataView.setUint16(6, pulseGapDuration, true);
      transferOutDataView.setUint16(8, secondPulseDuration, true);
      transferOutDataView.setUint16(10, secondPulseDuration, true);
      transferOutDataView.getUint8();

      if (selectedDevice === undefined) {
        alert("You haven't selected a device yet!");
        continue;
      }
      console.log(transferOutDataView);
      await selectedDevice.transferOut(2, transferOutDataView.buffer);
      console.log('sent');
      const { data: transferInData, status } = await selectedDevice.transferIn(2, 64);
      const weldStatus = transferInData.getUint8(0, true);
      const weldStatus2 = transferInData.getUint8(0, true);
      const weldStatus3 = transferInData.getUint8(0, true);
      console.log(transferInData, status, weldStatus, weldStatus2, weldStatus3);
    } catch (err) {
      console.error(err);
      alert('Something went wrong when sending the pulse data, check the console');
    } finally {
      transferring = false;
      rerender();
    }
  }
})();

const App = () => (
  <>
    <style>{styles.toString()}</style>
    <main>
      <UsbSelection device={selectedDevice} />
      <form
        $$submit={submissions.callback}
        class={styles.locals.form}
        $$input={formInputs.callback}
      >
        <RangeSlider
          name={FIRST_PULSE_DURATION_NAME}
          min={1}
          value={FIRST_PULSE_DURATION_DEFAULT}
          max={300}
          currentDuration={firstPulseDurations}
        >
          First pulse duration
        </RangeSlider>
        <RangeSlider
          name={PULSE_GAP_DURATION_NAME}
          min={1}
          value={PULSE_GAP_DURATION_DEFAULT}
          max={1000}
          currentDuration={pulseGapDurations}
        >
          Pulse gap duration
        </RangeSlider>
        <RangeSlider
          name={SECOND_PULSE_DURATION_NAME}
          min={1}
          value={SECOND_PULSE_DURATION_DEFAULT}
          max={300}
          currentDuration={secondPulseDurations}
        >
          Second pulse duration
        </RangeSlider>
        <button type="submit" $disabled={transferring}>Fire</button>
        {transferring ? 'Transferring' : undefined}
      </form>
    </main>
  </>
);

const rootElement = document.getElementById('root');
const rerender = () => cinder.render(<App />, rootElement);

rerender();
navigator.usb.addEventListener('connect', (event) => {
  devices.callback(event.device);
});

navigator.usb.addEventListener('disconnect', (event) => {
  devices.callback(undefined);
});
