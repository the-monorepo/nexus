import * as cinder from 'cinder';
import { render, DomElement } from 'cinder';

import styles from './index.scss';

import './ViolinGraph';

import { autorun } from 'mobx';

import cx from 'classnames';

const App = () => (
  <main class={styles.main}>
    <style>
      {styles.toString()}
    </style>
    <div class={styles.locals.graph}>
      <faultjs-violin />
    </div>
  </main>
);

const rerender = () => render(<App />, document.getElementById('root'));

autorun(() => {
  rerender();
});
