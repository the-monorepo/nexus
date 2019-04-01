import { createResume } from '@pshaw/resume-template';
import * as mbx from 'mobx-dom';
import * as data from './data';
const Resume = createResume();
const rootElement = document.getElementById('root');
mbx.render(rootElement, <Resume data={data} />);

/*
import * as mbx from 'mobx-dom';
import { observable } from 'mobx';
const store = observable({
  count: 0,
});
setInterval(() => {
  store.count++;
}, 1000);
class Test extends mbx.MobxElement {
  render() {
    return (
      <div>{store.count} - It works :O</div>
    );
  }
}
window.customElements.define('x-test', Test);
mbx.render(
  document.getElementById('root'),
  <Test />
);
*/