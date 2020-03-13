import * as mbx from 'mobx-dom';
import { DomElement, LightDomElement } from 'mobx-dom';

import { customElement } from 'custom-element';

import styles from './section.scss';
import unset from './unset.scss';

@customElement('shaw-section')
class SectionElement extends DomElement {
  render() {
    return (
      <>
        <section>
          <slot />
        </section>
      </>
    )
  }
}

@customElement('shaw-h1')
class H1Element extends DomElement {
  render() {
    return (
      <>
        <style>{unset}</style>
        <h1><slot /></h1>
      </>
    )
  }
}

@customElement('shaw-h2')
class H2Element extends DomElement {
  render() {
    return (
      <h2><slot /></h2>
    )
  }
}

@customElement('shaw-h3')
class H3Element extends DomElement {
  render() {
    return (
      <h3><slot /></h3>
    );
  }
}

@customElement('shaw-h4')
class H4Element extends DomElement {
  render() {
    return (
      <h4><slot /></h4>
    );
  }
}

@customElement('shaw-h5')
class H5Element extends DomElement {
  render() {
    return (
      <h5><slot /></h5>
    )
  }
}

@customElement('shaw-h6')
class H6Element extends DomElement {
  render() {
    return (
      <h6><slot /></h6>
    );
  }
}

@customElement('shaw-h7')
class H7Element extends DomElement {
  render() {
    return (
      <h7><slot /></h7>
    )
  }
}

@customElement('semantic-document-provider')
class SemanticElementProvider extends LightDomElement {
  render() {
    return (
      <>
        <style>{styles}</style>
        <slot />
      </>
    );
  }
}

mbx.render(
  <main>
    <semantic-document-provider>
      <shaw-section>
        <div class="rawr">
          <span>rawr</span>
          <shaw-h1>Heading 1</shaw-h1>
        </div>
        <h1>H1</h1>
        <shaw-h1 margin={true} class="rawr">Override 1</shaw-h1>
        <shaw-section>
          <shaw-h1>Heading 2</shaw-h1>
        </shaw-section>
      </shaw-section>
    </semantic-document-provider>
  </main>,
  document.getElementById('root')
);