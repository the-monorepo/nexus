import * as cinder from 'cinder';

import callbackGenerator from '@pipelines/callback-converter';
import broadcaster from '@pipelines/broadcaster';

import styles from './index.scss';

const callbackBroadcasterConverter = <T extends any>() => {
  const converter = callbackGenerator<T>();

  const broadcast = broadcaster(converter);
  broadcast['callback'] = (...args) => converter.callback(...args);

  return broadcast;
};

function storeLastValue<T>(asyncIterable: AsyncIterable<T>) {
  const iterator = asyncIterable[Symbol.asyncIterator]();

  let firstYieldedResult = iterator.next();
  let current;

  (async () => {
    let currentYield = firstYieldedResult;
    do {
      current = (await currentYield).value;
      currentYield = iterator.next();
    } while(!currentYield.done)
  })();

  return async () => {
    await firstYieldedResult;
    return current;
  };
}

const requestUSB = async () => {
  const device = await navigator.usb.requestDevice({ filters: [] });
  return device;
};

const claimUSB = async (device) => {
  await device.open();
  try {
    await device.selectConfiguration(1);
    await device.claimInterface(0);
  } catch (err) {
    await device.close();
    throw err;
  }
};

const createUSBConnectButton = ({ onDevice }) => {
  const onSelectUSBClick = async (event) => {
    const device = await requestUSB();
    onDevice(device);
  };

  const USBConnectButton = () => <button $$click={onSelectUSBClick}>Select USB</button>;

  return USBConnectButton;
};

let transferring = false;

const rawDevices = callbackBroadcasterConverter<[any]>();

const devicesWithInitial = (async function* deviceGenerator() {
  try {
    const initialDevices = await navigator.usb.getDevices();
    if (initialDevices.length >= 1) {
      yield initialDevices[0];
    }
  } catch (err) {
    console.error(err);
  }

  for await (const [device] of rawDevices) {
    yield device;
  }
})();

let selectedDevice = null;
(async () => {
  for await (const device of devicesWithInitial) {
    if (selectedDevice !== null) {
      selectedDevice.close();
    }
    if (device !== null) {
      try {
        await claimUSB(device);
        selectedDevice = device;
      } catch (err) {
        console.error(err);
        device.close();
        selectedDevice = null;
      }
    } else {
      selectedDevice = device;
    }
    rerender();
  }
})();

const disconnectDevice = () => rawDevices.callback(null);
const DisconnectButton = () => <button $$click={disconnectDevice}>Disconnect</button>;
const ConnectButton = createUSBConnectButton({
  onDevice: (device) => rawDevices.callback(device),
});
navigator.usb.addEventListener('connect', (e) => rawDevices.callback(e.device));
navigator.usb.addEventListener('disconnect', disconnectDevice);

const USBSelection = ({ device }) => {
  <section>{device === null ? undefined : `Selected ${device.productName}`}</section>;
};

export type RangeSliderInput = {
  defaultValue: number;
  name: string;
  min: number;
  max: number;
  step: number;
};

export type RangeSliderProps = {
  children: any;
};

async function * stringsToIntegers(strings: AsyncIterable<string>) {
  for await(const string of strings) {
    yield Number.parseInt(string);
  }
}
export const createRangeSlider = ({ defaultValue }: RangeSliderInput) => {
  const durationState = callbackGenerator<[Event]>();

  const durations = broadcaster(withDefault(stringsToIntegers(eventsToValue(durationState)), defaultValue));

  const RangeSlider = ({ children, ...other }: RangeSliderProps) => (
    <label class={styles.locals.rangeLabel}>
      {children}
      <div class={styles.locals.inputContainer}>
        <input
          type="range"
          class={styles.locals.rangeInput}
          $$input={durationState.callback}
          value={defaultValue}
          {...other}
        />
        <span watch_$textContent={durations} />
      </div>
    </label>
  );

  return [RangeSlider, durations];
};

async function* eventsToValue(events: AsyncIterable<Event>) {
  for await (const [e] of events) {
    yield e.target.value;
  }
}

async function* withDefault(iterable: AsyncIterable<T>, defaultValue: T): AsyncIterable<T> {
  yield defaultValue;
  yield * iterable;
}

const formInputs = callbackBroadcasterConverter<[Event]>();

const [FirstPulseSlider, firstPulseDurations] = createRangeSlider({
  defaultValue: 60,
  min: 1,
  max: 300,
});
const mostRecentFirstPulseDuration = storeLastValue(firstPulseDurations);

const [PulseGapSlider, pulseGapDurations] = createRangeSlider({
  defaultValue: 30,
  min: 1,
  max: 1000,
});
const mostRecentPulseGapDuration = storeLastValue(pulseGapDurations);

const [SecondPulseSlider, secondPulseDurations] = createRangeSlider({
  defaultValue: 120,
  min: 1,
  max: 300,
});
const mostRecentSecondPulseDuration = storeLastValue(secondPulseDurations);

const submissions = callbackBroadcasterConverter<[Event]>();
(async () => {
  for await (const [e] of submissions) {
    e.preventDefault();

    transferring = true;
    rerender();

    try {
      const formData = new FormData(e.target);

      const [
        firstPulseDuration,
        pulseGapDuration,
        secondPulseDuration,
      ] = await Promise.all([
        mostRecentFirstPulseDuration(),
        mostRecentPulseGapDuration(),
        mostRecentSecondPulseDuration(),
      ]);

      console.log(firstPulseDuration, pulseGapDuration, secondPulseDuration)

      const transferOutDataView = new DataView(new ArrayBuffer(12));
      transferOutDataView.setUint16(0, firstPulseDuration, true);
      transferOutDataView.setUint16(2, firstPulseDuration, true);
      transferOutDataView.setUint16(4, pulseGapDuration, true);
      transferOutDataView.setUint16(6, pulseGapDuration, true);
      transferOutDataView.setUint16(8, secondPulseDuration, true);
      transferOutDataView.setUint16(10, secondPulseDuration, true);

      if (selectedDevice === undefined) {
        alert("You haven't selected a device yet!");
        continue;
      }
      await selectedDevice.transferOut(2, transferOutDataView.buffer);
      const { data: transferInData, status } = await selectedDevice.transferIn(2, 64);
      const weldStatus = transferInData.getUint8(0, true);
      if (weldStatus > 0) {
        alert(`Error: Received spot weld status "${weldStatus}"`);
      }
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
      <USBSelection device={selectedDevice} />
      <ConnectButton />
      {selectedDevice === null ? <DisconnectButton /> : null}
      <form
        $$submit={submissions.callback}
        class={styles.locals.form}
        $$input={formInputs.callback}
      >
        <FirstPulseSlider>First pulse duration</FirstPulseSlider>
        <PulseGapSlider>Pulse gap duration</PulseGapSlider>
        <SecondPulseSlider>Second pulse duration</SecondPulseSlider>
        <button type="submit" $disabled={transferring}>
          Fire
        </button>
        {transferring ? 'Transferring' : undefined}
      </form>
    </main>
  </>
);

const rootElement = document.getElementById('root');
const rerender = () => cinder.render(<App />, rootElement);

rerender();
