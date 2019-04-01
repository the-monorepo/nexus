/*import { createResume } from '@pshaw/resume-template';
import * as mbx from 'mobx-dom';
import * as data from './data';
const Resume = createResume();
const rootElement = document.getElementById('root');
mbx.render(rootElement, <Resume data={data} />);*/

import * as mbx from 'mobx-dom';
import { map, MobxElement } from 'mobx-dom';
import { observable, action, autorun, isObservableArray } from 'mobx';

const store = observable({
  arr: observable.array()
});
map(store.arr, () => {});

setInterval(action(() => {
  store.arr.push('1');
  console.log('update');
}), 1000);
class Test extends MobxElement {  
  render() {
    return <> 
      {store.arr ? map(store.arr, (v) => <span>{v}</span>) : null}
    </>
  }
}
window.customElements.define('x-test', Test);

mbx.render(
  document.getElementById('root'),
  <Test />
);
