import * as cinder from '../src/index';
import { render } from '../src/index';

describe.skip('basic rendering', () => {
  let root;
  beforeEach(() => {
    root = document.createElement('body');
  });
  it.skip('div tag string', () => {
    render(root, <div className="test" />);
  });

  it.skip('HTMLElement constructor', () => {
    class TestElement extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        const divElement = document.createElement('div');
        divElement.className = 'test';
        shadow.appendChild(divElement);
      }
    }
    globalThis.customElements.define('x-test', TestElement);
    render(root, <TestElement />);
  });

  it.skip('SFC', () => {
    const SFC = () => <div className="test" />;
    render(root, <SFC />);
  });

  it.skip('Fragment', () => {
    const Fragment = <></>;
    render(root, Fragment);
  });
});
