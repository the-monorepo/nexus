import * as cinder from 'cinder';

import {
  broadcaster,
  zip,
  callbackConverter,
  latestValueStore,
  map,
} from '@pipelines/core-2';

import styles from './index.scss';

const callbackBroadcasterConverter = <T extends any>() => {
  const converter = callbackConverter<T>();

  const broadcast = broadcaster(converter);

  broadcast['callback'] = converter.callback;

  return {
    ...converter,
    [Symbol.asyncIterator]() {
      return broadcast;
    },
  };
};

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
    console.warn(event);
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
    console.log('initial', initialDevices);
    for(const device of initialDevices) {
      if (device.productId === 29987) {
        yield device;
      } else {
        await device.open();
        await device.reset();
        await device.close();
      }
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
    console.log('DEVICE SEELCTED', device, selectedDevice);
    if (selectedDevice !== null) {
      try {
        await selectedDevice.reset();
        await selectedDevice.close();
        console.log('reset');
      } catch(err){
        console.error(err);
      }
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
      selectedDevice = null;
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

const USBSelection = ({ device }) => (
  <section>{device === null ? undefined : `Selected ${device.productName}`}</section>
);

export type RangeSliderInput = {
  defaultValue: number;
};

export type RangeSliderProps = {
  children: any;
};

export const createRangeSlider = ({ defaultValue }: RangeSliderInput) => {
  const durationState = callbackConverter<[Event]>();
  const durations = broadcaster(
    withDefault(
      map(durationState, ([e]) => {
        e.preventDefault();

        return Number.parseInt(e.target.value);
      }),
      defaultValue,
    )
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

  const mostRecentFirstPulseDuration = latestValueStore(firstPulseDurations);

  const [PulseGapSlider, pulseGapDurations] = createRangeSlider({
    defaultValue: 30,
  });
  const mostRecentPulseGapDuration = latestValueStore(pulseGapDurations);

  const [SecondPulseSlider, secondPulseDurations] = createRangeSlider({
    defaultValue: 120,
  });
  const mostRecentSecondPulseDuration = latestValueStore(secondPulseDurations);

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

  const recognition = new (globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.lang = navigator.languages[0];
  recognition.interimResults = false;

  const speechRecognitionList = new (globalThis.SpeechGrammarList || globalThis.webkitSpeechGrammarList)();
  speechRecognitionList.addFromString('start', 1);
  recognition.grammars = speechRecognitionList;

  recognition.maxAlternatives = 1;

  recognition.start();
  recognition.onresult = function(event) {
    console.log(event);
    // TODO: Totally hacky - Doesn't account for multiple words
    const speechResult = event.results[event.resultIndex];
    if (speechResult.length > 1 && speechResult.isFinal) {
      return;
    }
    const weldResult = speechResult[0];
    // TODO: Need some feedback if we're not confident enough
    if (weldResult.confidence > 0.95 && weldResult.transcript.includes('start')) {
      submissions.callback(event);
    }
  };
  recognition.onspeechend = () => {
    console.log('ended');
    recognition.abort();
    recognition.start();
  };
  recognition.onnomatch = function(event) {
    console.log('No speech result');
    recognition.start();
  }

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
})();{}

const App = () => (
  <>
    <style>{styles.toString()}</style>
    <main>
      <USBSelection device={selectedDevice} />
      <ConnectButton />
      {selectedDevice !== null ? <DisconnectButton /> : null}
      <Form disabled={transferring} />
      {transferring ? 'Transferring' : undefined}
    </main>
  </>
);

const rootElement = document.getElementById('root');
const rerender = () => cinder.render(<App />, rootElement);

rerender();
