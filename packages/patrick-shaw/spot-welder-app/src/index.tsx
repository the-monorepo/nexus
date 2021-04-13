import * as cinder from 'cinder';

import {
  broadcaster,
  zip,
  callbackConverter as callbackGenerator,
  map,
} from '@pipelines/core-2';

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
    } while (!currentYield.done);
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
};

export type RangeSliderProps = {
  children: any;
};

export const createRangeSlider = ({ defaultValue }: RangeSliderInput) => {
  const durationState = callbackGenerator<[Event]>();
  const durations = broadcaster(
    withDefault(
      map(durationState, ([e]) => {
        e.preventDefault();

        return Number.parseInt(e.target.value);
      }),
      defaultValue,
    ),
  );

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

async function* withDefault(
  iterable: AsyncIterable<T>,
  defaultValue: T,
): AsyncIterable<T> {
  yield defaultValue;
  yield* iterable;
}

const createSpotWelderForm = () => {
  const [FirstPulseSlider, firstPulseDurations] = createRangeSlider({
    defaultValue: 60,
  });

  const mostRecentFirstPulseDuration = storeLastValue(firstPulseDurations);

  const [PulseGapSlider, pulseGapDurations] = createRangeSlider({
    defaultValue: 30,
  });
  const mostRecentPulseGapDuration = storeLastValue(pulseGapDurations);

  const [SecondPulseSlider, secondPulseDurations] = createRangeSlider({
    defaultValue: 120,
  });
  const mostRecentSecondPulseDuration = storeLastValue(secondPulseDurations);

  const submissions = callbackBroadcasterConverter<[Event]>();
  const spotWelderTriggers = map(submissions, async ([e]) => {
    e.preventDefault();

    const [
      firstPulseDuration,
      pulseGapDuration,
      secondPulseDuration,
    ] = await Promise.all([
      mostRecentFirstPulseDuration(),
      mostRecentPulseGapDuration(),
      mostRecentSecondPulseDuration(),
    ]);

    console.log(firstPulseDuration, pulseGapDuration, secondPulseDuration);

    return {
      firstPulseDuration,
      pulseGapDuration,
      secondPulseDuration,
    };
  });

  const Form = ({ disabled }) => (
    <form $$submit={submissions.callback} class={styles.locals.form}>
      <FirstPulseSlider min={1} max={300}>
        First pulse duration
      </FirstPulseSlider>
      <PulseGapSlider min={1} max={1000}>
        Pulse gap duration
      </PulseGapSlider>
      <SecondPulseSlider min={1} max={300}>
        Second pulse duration
      </SecondPulseSlider>
      <button type="submit" $disabled={disabled}>
        Fire
      </button>
    </form>
  );

  return [Form, spotWelderTriggers];
};

const [Form, spotWelderTriggers] = createSpotWelderForm();

let transferring = false;
(async () => {
  for await (const {
    firstPulseDuration,
    pulseGapDuration,
    secondPulseDuration,
  } of spotWelderTriggers) {
    transferring = true;
    rerender();

    try {
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
      <Form disabled={transferring} />
      {transferring ? 'Transferring' : undefined}
    </main>
  </>
);

const rootElement = document.getElementById('root');
const rerender = () => cinder.render(<App />, rootElement);

rerender();
