import * as cinder from 'cinder';

import callbackGenerator from 'callback-to-async-iterable';

import styles from './index.scss';

const requestUSB = async () => {
  const device = await navigator.usb.requestDevice({ filters: [] });

  await device.open();
  try {
    console.log(device);
    await device.selectConfiguration(1);
    await device.claimInterface(0);
  } catch (err) {
    await device.close();
    throw err;
  }

  return device;
};

let device: undefined | any;

export type RangeSliderProps = {
  name: string;
  children: any;
  min: number;
  max: number;
  step: number;
  currentDuration: AsyncIterable<number>;
};

console.log(styles);
export const RangeSlider = ({ children, currentDuration, ...other }: RangeSliderProps) => (
  <>
    <label class={styles.locals.rangeLabel}>
      {children}
      <div class={styles.locals.inputContainer}>
        <input
          type="range"
          class={styles.locals.rangeInput}
          {...other}
        />
        <span watch_$textContent={currentDuration}/>
      </div>
    </label>
  </>
);

async function* eventsToValueByName(events: AsyncIterable<Event>, name: string) {
  for await(const [e] of events) {
    if (e.target.name === name) {
      yield e.target.value;
    }
  }
}

// TODO: If state was scoped to RangeSlider, woudln't need this
async function* withDefault(iterable: AsyncIterable<T>, defaultValue: T) {
  yield defaultValue;
  yield *iterable;
}

const formInputs = callbackGenerator<[Event]>();

const FIRST_PULSE_DURATION_DEFAULT = 60;
const FIRST_PULSE_DURATION_NAME = 'firstPulseDuration';

const PULSE_GAP_DURATION_DEFAULT = 30;
const PULSE_GAP_DURATION_NAME = 'pulseGapDuration';

const SECOND_PULSE_DURATION_DEFAULT = 120;
const SECOND_PULSE_DURATION_NAME = 'secondPulseDuration';

const firstPulseDurations = withDefault(eventsToValueByName(formInputs, FIRST_PULSE_DURATION_NAME), FIRST_PULSE_DURATION_DEFAULT);
const pulseGapDurations = withDefault(eventsToValueByName(formInputs, PULSE_GAP_DURATION_NAME), PULSE_GAP_DURATION_DEFAULT);
const secondPulseDurations = withDefault(eventsToValueByName(formInputs, SECOND_PULSE_DURATION_NAME), SECOND_PULSE_DURATION_DEFAULT);

const submissions = callbackGenerator<[Event]>();
(async () => {
  for await (const [e] of submissions) {
    e.preventDefault();

    if (device === undefined) {
      alert("You haven't selected a device yet!");
      continue;
    }

    try {
      const formData = new FormData(e.target);

      const firstPulseDuration = Number.parseInt(formData.get(FIRST_PULSE_DURATION_NAME));
      const pulseGap = Number.parseInt(formData.get(PULSE_GAP_DURATION_NAME));
      const secondPulseDuration = Number.parseInt(formData.get(SECOND_PULSE_DURATION_NAME));

      const data = new Uint16Array([firstPulseDuration, firstPulseDuration, pulseGap, pulseGap, secondPulseDuration, secondPulseDuration]);
    } catch(err) {
      console.error(err);
      alert("Something went wrong when sending the pulse data, check the console");
    }
  }
})();

const App = () => (
  <>
    <style>{styles.toString()}</style>
    <main>
      <test-dialog>Test</test-dialog>
      <form $$submit={submissions.callback} class={styles.locals.form} $$input={formInputs.callback}>
        <RangeSlider name={FIRST_PULSE_DURATION_NAME} min={1} value={FIRST_PULSE_DURATION_DEFAULT} max={300} currentDuration={firstPulseDurations}>First pulse duration</RangeSlider>
        <RangeSlider name={PULSE_GAP_DURATION_NAME} min={1} value={PULSE_GAP_DURATION_DEFAULT} max={1000} currentDuration={pulseGapDurations}>Pulse gap duration</RangeSlider>
        <RangeSlider name={SECOND_PULSE_DURATION_NAME} min={1} value={SECOND_PULSE_DURATION_DEFAULT} max={300} currentDuration={secondPulseDurations}>Second pulse duration</RangeSlider>
        <button type="submit">Fire</button>
      </form>
    </main>
  </>
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
