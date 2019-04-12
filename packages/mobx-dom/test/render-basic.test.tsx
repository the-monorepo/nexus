import * as mbx from '../src/index';
import { MobxElement, render } from '../src/index';

describe('basic rendering', () => {
  let root;
  beforeEach(() => {
    root = document.createElement('body');
  });
  it('div tag string', () => {
    render(root, <div className="test"/>);
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
    window.customElements.define('x-test', TestElement);
    render(root, <TestElement/>);
  });

  it.skip('MobxElement constructor', () => {
    class TestElement extends MobxElement {
      render() {
        return <div className="test"/>;
      }
    }
    render(root, <TestElement/>);
  })

  it('static component', () => {
    const StaticComponent = <div className="test"/>;
    render(root, <StaticComponent />)
  });

  it('SFC', () => {
    const SFC = () => <div className="test"/>;
    render(root, <SFC/>)
  });

  it('Fragment', () => {
    const Fragment = <></>;
    render(root, Fragment);
  });
})