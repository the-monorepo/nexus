/*import { createResume } from '@pshaw/resume-template';
import * as mbx from 'mobx-dom';
import * as data from './data';
const Resume = createResume();
const rootElement = document.getElementById('root');
mbx.render(rootElement, <Resume data={data} />);*/

import * as mbx from 'mobx-dom';
import { map, MobxElement } from 'mobx-dom';
import { observable, action, autorun, isObservableArray } from 'mobx';


/*const store = observable({
  arr: observable.array([])
});
setInterval(action(() => {
  const add = Math.round(Math.random()) === 0;
  if (add) {
    store.arr.push(observable.array());
  } else {
    if(store.arr.length > 0) {
      store.arr.pop();
    }
  }
  store.arr.forEach((inner) => {
    const append = Math.round(Math.random()) === 0;
    if (append) {
      inner.push(0);
    } else {
      if(inner.length > 0) {
        inner.pop();
      }
    }
    for(let i = 0; i< inner.length; i++) {
      inner[i] = Math.round(Math.random());
    }
  });
}));
class Test extends MobxElement {  
  render() {
    return <>
      <div>This should be at the top</div>
      {map(store.arr, (inner) => <div>{map(inner, (v) => <span style={{ width: '10px', height: '10px', color: v === 0 ? 'red' : 'green' }}></span>)}</div>)}
      <div>This should be at the bottom</div>
    </>;

  }
}

window.customElements.define('x-test', Test);*/

let i = 0;
const store = observable({
  arr: observable.array([])
});
setInterval(action(() => {
  if(i < 2) {
    store.arr.push(i);
  } else {
    store.arr.pop();
  }
  console.warn('update', store.arr.length);
  i++;
  i %= 4;
}), 1000);
class Test extends MobxElement {  
  render() {
    return <>
      <div>This should be at the top</div>
      {map(store.arr, (inner) => <div>{inner}</div>)}
      <div>This should be at the bottom</div>
    </>;

  }
}
window.customElements.define('x-test', Test);

mbx.render(
  document.getElementById('root'),
  <Test />
);
