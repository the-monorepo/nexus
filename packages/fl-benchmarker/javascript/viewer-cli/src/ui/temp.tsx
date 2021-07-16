// TODO: Remove eslint disable rule after MVP
/* eslint-disable no-console */
import * as cinder from 'cinder';
import { render } from 'cinder';

import styles from './index.scss';

import './ViolinGraph';

import { autorun, observable, action } from 'mobx';

const kernalBandwidth = observable.box(0.2);
const resolution = observable.box(10);

const data2 = [
  { name: 'project-1', value: 0 },
  { name: 'project-1', value: 0.1 },
  { name: 'project-1', value: 0.12 },
  { name: 'project-1', value: 0.15 },
  { name: 'project-1', value: 0.18 },
  { name: 'project-1', value: 0.5 },
  { name: 'project-1', value: 0.5 },
  { name: 'project-1', value: 0.57 },
  { name: 'project-1', value: 0.9 },
  { name: 'project-1', value: 1 },
];

const data1 = [
  { name: 'project-1', value: 0 },
  { name: 'project-1', value: 0.1 },
  { name: 'project-1', value: 0.12 },
  { name: 'project-1', value: 0.1 },
  { name: 'project-1', value: 0 },
  { name: 'project-1', value: 0.5 },
  { name: 'project-1', value: 0.9 },
  { name: 'project-1', value: 0.9 },
  { name: 'project-1', value: 1 },
];

const dataMap = [
  { name: 'title', data: data1 },
  { name: 'otherstuff', data: data2 },
  {
    name: 'erawr',
    data: [
      { name: 'rawr', value: 0 },
      { name: 'hmm', value: 0.4 },
      { name: 'rawr', value: 0.7 },
    ],
  },
];

const onBandwidthChange = action((e) => {
  kernalBandwidth.set(e.target.value);
});

const onResolutionChange = action((e) => {
  resolution.set(e.target.value);
});

const App = () => (
  <main class={styles.main}>
    <style>{styles.toString()}</style>
    <div class={styles.locals.graph}>
      <faultjs-violin
        $dataMap={dataMap}
        $bandwidth={kernalBandwidth.get()}
        $resolution={resolution.get()}
      />
    </div>
    <label for="bandwidth">Bandwidth: {kernalBandwidth.get()}</label>
    <input
      id="bandwidth"
      step="0.001"
      min="0"
      max="1"
      type="range"
      $$input={onBandwidthChange}
    />
    <label for="resolution">Resolution: {resolution.get()}</label>
    <input
      id="resolution"
      step="1"
      min="1"
      max="50"
      type="range"
      $$input={onResolutionChange}
    />
  </main>
);

const rerender = () => render(<App />, document.getElementById('root'));

autorun(() => {
  console.log('rerender', __FAULT_BENCHMARKER_DATA__);
  rerender();
});
