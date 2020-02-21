import * as mbx from 'mobx-dom';
import { DomElement, rerender } from 'mobx-dom';

import styles from './collapsible.css';

class Collapsible extends DomElement {
  render() {
    return (
      <>
        <style>{styles.toString()}</style>
        <section>
          <input id="collapsible" class="toggle" type="checkbox" />
          <label for="collapsible" class="lbl-toggle">More Info</label>
        </section>
      </>
    )
  }
}