// TODO: Remove no-console at some point
/* eslint-disable no-console */
import * as cinder from 'cinder';

import { broadcaster, callbackConverter, latestValueStore, map } from '@pipelines/core-2';

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

  const USBConnectButton = () => (
    <button $$click={onSelectUSBClick} type="submit">
      Select USB
    </button>
  );

  return USBConnectButton;
};

const rawDevices = callbackBroadcasterConverter<[any]>();

const devicesWithInitial = (async function* deviceGenerator() {
  try {
    const initialDevices = await navigator.usb.getDevices();
    for (const device of initialDevices) {
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
    ),
  );

  const RangeSlider = ({ children, ...other }: RangeSliderProps) => (
    <label class={styles.locals.rangeLabel}>
      {children}
      <div class={styles.locals.inputContainer}>
        <input
          {...other}
          type="range"
          class={styles.locals.rangeInput}
          $$input={durationState.callback}
          value={defaultValue}
        />
        <span class={styles.locals.inputValue} watch_$textContent={durations} />
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
    defaultValue: 39,
  });

  const mostRecentFirstPulseDuration = latestValueStore(firstPulseDurations);

  const [PulseGapSlider, pulseGapDurations] = createRangeSlider({
    defaultValue: 200,
  });
  const mostRecentPulseGapDuration = latestValueStore(pulseGapDurations);

  const [SecondPulseSlider, secondPulseDurations] = createRangeSlider({
    defaultValue: 120,
  });
  const mostRecentSecondPulseDuration = latestValueStore(secondPulseDurations);

  const submissions = callbackBroadcasterConverter<[Event]>();
  const spotWelderTriggers = map(submissions, async ([e]) => {
    e.preventDefault();

    const [firstPulseDuration, pulseGapDuration, secondPulseDuration] = await Promise.all(
      [
        mostRecentFirstPulseDuration(),
        mostRecentPulseGapDuration(),
        mostRecentSecondPulseDuration(),
      ],
    );

    return {
      firstPulseDuration,
      pulseGapDuration,
      secondPulseDuration,
    };
  });

  const audioCtx = new AudioContext();
  const volume = audioCtx.createGain();
  volume.gain.value = 0.25;
  volume.connect(audioCtx.destination);

  const demos = callbackBroadcasterConverter<[Event]>();
  (async () => {
    for await (const [e] of demos) {
      e.preventDefault();
      const [firstPulseDuration, pulseGapDuration, secondPulseDuration] =
        await Promise.all([
          mostRecentFirstPulseDuration(),
          mostRecentPulseGapDuration(),
          mostRecentSecondPulseDuration(),
        ]);

      const lowSound = audioCtx.createOscillator();
      lowSound.frequency.setValueAtTime(220, 0);
      lowSound.connect(volume);
      lowSound.start();
      await new Promise((resolve) => setTimeout(resolve, firstPulseDuration));
      lowSound.disconnect();

      await new Promise((resolve) => setTimeout(resolve, pulseGapDuration));

      const highSound = audioCtx.createOscillator();
      highSound.frequency.setValueAtTime(440, 0);
      highSound.connect(volume);
      highSound.start();
      await new Promise((resolve) => setTimeout(resolve, secondPulseDuration));
      highSound.disconnect();
    }
  })();

  const recognition = new (globalThis.SpeechRecognition ||
    globalThis.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.lang = navigator.languages[0];
  recognition.interimResults = false;

  const speechRecognitionList = new (globalThis.SpeechGrammarList ||
    globalThis.webkitSpeechGrammarList)();
  speechRecognitionList.addFromString('start', 1);
  recognition.grammars = speechRecognitionList;

  recognition.maxAlternatives = 1;

  recognition.start();
  recognition.onresult = function (event) {
    // TODO: Totally hacky - Doesn't account for multiple words
    const speechResult = event.results[event.resultIndex];
    if (speechResult.length > 1 && speechResult.isFinal) {
      return;
    }
    const weldResult = speechResult[0];
    // TODO: Need some feedback if we're not confident enough
    if (weldResult.confidence > 0.95 && /\bstart\b/.test(weldResult.transcript)) {
      submissions.callback(event);
    }
  };
  recognition.onend = () => {
    recognition.start();
  };
  recognition.onspeechend = () => {
    console.log('ended');
  };
  recognition.onnomatch = () => {
    console.log('No speech result');
  };

  const Form = ({ disabled }) => (
    <>
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
        <button $$click={demos.callback}>Demo</button>
      </form>
    </>
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
      if (status !== 'ok') {
        // TODO: Don't "throw" the error
        throw new Error(`Status was ${status}`);
      }
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

// TODO: Type this properly
let selectedDevice: any = null;
(async () => {
  for await (const device of devicesWithInitial) {
    if (selectedDevice !== null) {
      try {
        await selectedDevice.reset();
        await selectedDevice.close();
      } catch (err) {
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

const USBInfo = () => (
  <section>
    <USBSelection device={selectedDevice} />
    <ConnectButton />
    {selectedDevice !== null ? <DisconnectButton /> : null}
  </section>
);

const App = () => (
  <>
    <style>{styles.toString()}</style>
    <main>
      <USBInfo />
      <Form disabled={transferring} />
      {transferring ? 'Transferring' : undefined}
    </main>
  </>
);

const rootElement = document.getElementById('root');
const rerender = () => cinder.render(<App />, rootElement);

rerender();
