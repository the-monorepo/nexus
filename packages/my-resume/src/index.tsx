/*import { createResume } from '@pshaw/resume-template';
import * as mbx from 'mobx-dom';
import * as data from './data';
const Resume = createResume();
const rootElement = document.getElementById('root');
mbx.render(rootElement, <Resume data={data} />);*/

import * as mbx from 'mobx-dom';
import map from 'mobx-map';
import { MobxElement } from 'mobx-dom';
import { observable, action, autorun, isObservableArray } from 'mobx';
import { render } from 'mobx-dom/src';
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
ReactDOM.render(<Test/>, document.getElementById('root'));
*/
/*import * as mbx from 'mobx-dom';
import { MobxElement } from 'mobx-dom';
import map from 'mobx-map';
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
);*/
const OuterComponent = (
  <button $$click={() => console.log('test')}>
    Only
  </button>
);
render(document.getElementById('root'), <OuterComponent/>);

/*const store = observable({
  arr: observable.array([[]] as number[][]),
});

const tick = action(() => {
  const add = Math.round(Math.random()) === 0;
  if (add) {
    store.arr.push(observable.array([]));
  } else {
    if (store.arr.length > 0) {
      store.arr.pop();
    }
  }
  store.arr.forEach(inner => {
    const append = Math.round(Math.random()) === 0;
    if (append) {
      inner.splice(Math.round(Math.random()) * inner.length, 0, 0);
    } else {
      if (inner.length > 0) {
        const index = Math.floor(Math.random()) * inner.length;
        inner.splice(index, 1);
      }
    }
  });
});
const Block = (
  <div
    style={{
      width: '10px',
      height: '10px',
      background: ['red', 'green', 'blue'][Math.round(Math.random() * 2)],
      display: 'inline-block',
    }}
  />
);

const Row = (
  <div>
    {map(this.props.row, () => (
      <Block />
    ))}
  </div>
);

const Test = (
  <>
    <div>This should be at the top</div>
    {map(this.props.arr, (row) => <Row row={row}/>)}
    <div>This should be at the bottom</div>
  </>
);
mbx.render(document.getElementById('root'), <Test bleh="rawr" arr={store.arr} />);
setInterval(tick);*/
/*const Rawr = <p className="rawr">
  <div className="test"/>
  <div className="test2"/>
</p>
const Outer = <div><span>{<Rawr/>}</span></div>;
mbx.render(document.getElementById('root'), <Outer/>, undefined, { root: true });

/*
console.warn('Create outer');
const Inner = <p>
  <div className="tawr"/>
  <div className="raweraewrr"/>
</p>
const Outer = (
  <div className='rawr'>
    <Inner />
  </div>
);
console.warn('use outer');
const Root = (
  <div>
    <Outer value='1111'/>
    <Outer value='2222'/>
    <Outer value='3333'/>
    <Outer value='4444'/>
  </div>
);
console.log(Root);
console.warn('use and render')
render(document.getElementById('root'), Root, undefined, { thisIsRoot: true });
*/
/*
let i = 0;
const store = observable({
  arr: [[1, 2, 3], []],
});
const tick = action(() => {
  if(i < 2) {
    console.log('push');
    store.arr[1].push(i);
  } else {
    console.log('pop');
    store.arr[1].pop();
  }
  console.warn('update', store.arr[1].length);
  i++;
  i %= 4;
});
setInterval(tick, 1000);

class Block extends MobxElement {}
Block.template = (
  <>
    <div
      style={{
        width: '10px',
        height: '10px',
        background: ['red', 'green', 'blue'][Math.round(Math.random() * 2)],
        display: 'inline-block',
      }}
    />
  </>
);
window.customElements.define('x-block', Block);

class Row extends MobxElement { }
Row.template = (
  <div>
    {
      map(this.props.row, block => (
        <Block/>
      ))
    }
  </div>
)
window.customElements.define('x-row', Row);

class Test extends MobxElement {}
Test.template = (
  <>
    <div>This should be at the top</div>
    {map(store.arr, inner => (
      <Row row={inner}/>
    ))}
    <div>This should be at the bottom</div>
  </>
);
window.customElements.define('x-test', Test);
mbx.render(document.getElementById('root'), <Test />);

*/
