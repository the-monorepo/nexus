/*import { createResume } from '@pshaw/resume-template';
import * as mbx from 'mobx-dom';
import * as data from './data';
const Resume = createResume();
const rootElement = document.getElementById('root');
mbx.render(rootElement, <Resume data={data} />);*/
import * as mbx from 'mobx-dom';
import { MobxElement, map } from 'mobx-dom';
import { observable, action, autorun, isObservableArray } from 'mobx';
const store = observable({
  arr: []
});
let i = 0;
setInterval(
  action(() => {
    //store.obj.className = store.obj.className === '1' ? '2' : '1';
    //store.obj.className = store.obj.className === '1' ? '2' : '1';
    store.arr.push(i++);
  }),
  500,
);

class Test extends MobxElement {
  static get render() {
    return (
        <>
          {store.arr.map(v => <div>{v}</div>)}
        </>
    );
  };
}

window.customElements.define('x-test', Test);
mbx.render(document.getElementById('root'), <Test obj={store.obj} />);

/*No double assignment of props
import * as mbx from 'mobx-dom';
import { MobxElement, map } from 'mobx-dom';
import { observable, action, autorun, isObservableArray } from 'mobx';
<div>
  <>Lol</>
</div>;
const store = observable({
  obj: {
    className: '1',
    text: 'a',
  },
});
setInterval(
  action(() => {
    //store.obj.className = store.obj.className === '1' ? '2' : '1';
    //store.obj.className = store.obj.className === '1' ? '2' : '1';
    store.obj.text = store.obj.text === 'a' ? 'b' : 'a';
    console.log('update');
  }),
  500,
);

class Test extends MobxElement {
  render() {
    return (
      <>
        <div className={this.props.obj.className && console.log('rendered')}>
          {this.props.obj.text}
        </div>
      </>
    );
  }
}

window.customElements.define('x-test', Test);
mbx.render(document.getElementById('root'), <Test obj={store.obj} />);
*/
/*
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action, autorun, isObservableArray } from 'mobx';

class Test extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      arr: [[]]
    };
    setInterval(() => {
      this.setState(prevState => {  
        const add = Math.round(Math.random()) === 0;
        if(add) {
          prevState.arr.push(observable.array());
        } else {
          if(prevState.arr.length > 0) {
            prevState.arr.pop();
          }
        }
        prevState.arr.forEach(inner => {
          const append = Math.round(Math.random()) === 0;
            if (append) {
              inner.push(0);
            } else {
              if(inner.length > 0) {
                const index = Math.floor(Math.random()) * inner.length;
                inner.splice(index, 1);
              }
            }
        });
        return prevState
      });
    });
  }

  render() {
    return (
      <div>
        <div>This should be at the top</div>
        {this.state.arr.map((inner) => <div>{inner.map((v) => <div style={{ width: '10px', height: '10px', background: ['red', 'green', 'blue'][Math.round(Math.random() * 2)], display: 'inline-block' }}></div>)}</div>)}
        <div>This should be at the bottom</div>
      </div>
    );
  }
}
ReactDOM.render(<Test/>, document.getElementById('root'));*/
/*
import * as mbx from 'mobx-dom';
import { MobxElement, map } from 'mobx-dom';
import { observable, action, autorun, isObservableArray } from 'mobx';
const store = observable({
  arr: observable.array([]),
});
setInterval(
  action(() => {
    const add = Math.round(Math.random()) === 0;
    if (add) {
      store.arr.push(observable.array([1, 2, 3]));
    } else {
      if (store.arr.length > 0) {
        store.arr.pop();
      }
    }
    store.arr.forEach(inner => {
      const append = Math.round(Math.random()) === 0;
      if (append) {
        inner.push(0);
      } else {
        if (inner.length > 0) {
          const index = Math.floor(Math.random()) * inner.length;
          inner.splice(index, 1);
        }
      }
    });
  }),
);
class Test extends MobxElement {
  render() {
    return (
      <>
        <div>This should be at the top</div>
        {map(store.arr, inner => (
          <div>
            {map(inner, v => (
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  background: ['red', 'green', 'blue'][Math.round(Math.random() * 2)],
                  display: 'inline-block',
                }}
              />
            ))}
          </div>
        ))}
        <div>This should be at the bottom</div>
      </>
    );
  }
}

window.customElements.define('x-test', Test);
mbx.render(document.getElementById('root'), <Test />);*/

/*import * as mbx from 'mobx-dom';
import { map, MobxElement } from 'mobx-dom';
import { observable, action, autorun, isObservableArray } from 'mobx';

const store = observable({
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
        const index = Math.floor(Math.random()) * inner.length;
        inner.splice(index, 1);
      }
    }
  });
}));
class Test extends MobxElement {  
  render() {
    return <>
      <div>This should be at the top</div>
      {map(store.arr, (inner) => <div>{map(inner, (v) => <div style={{ width: '10px', height: '10px', background: ['red', 'green', 'blue'][Math.round(Math.random() * 2)], display: 'inline-block' }}></div>)}</div>)}
      <div>This should be at the bottom</div>
    </>;

  }
}

window.customElements.define('x-test', Test);*/
/*
let i = 0;
const store = observable({
  arr: [[1, 2, 3]],
});
setInterval(action(() => {
  if(i < 2) {
    store.arr[1].push(i);
  } else {
    store.arr[1].pop();
  }
  console.warn('update', store.arr.length);
  i++;
  i %= 4;
}), 1000);

/*
class Test extends MobxElement {
  render() {
    return (
      <>
        <div>This should be at the top</div>
        {map(store.arr, inner => (
          <div>
            {map(inner, v => (
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  background: v === 0 ? 'red' : 'green',
                }}
              />
            ))}
          </div>
        ))}
        <div>This should be at the bottom</div>
      </>
    );
  }
}
window.customElements.define('x-test', Test);
mbx.render(document.getElementById('root'), <Test />);
*/
