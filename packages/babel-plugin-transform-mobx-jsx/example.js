import * as mbx from './mobx-dom';
import { render, repeat } from './mobx-dom';

const adjectives = [
  'pretty',
  'large',
  'big',
  'small',
  'tall',
  'short',
  'long',
  'handsome',
  'plain',
  'quaint',
  'clean',
  'elegant',
  'easy',
  'angry',
  'crazy',
  'helpful',
  'mushy',
  'odd',
  'unsightly',
  'adorable',
  'important',
  'inexpensive',
  'cheap',
  'expensive',
  'fancy',
];
const colours = [
  'red',
  'yellow',
  'blue',
  'green',
  'pink',
  'brown',
  'purple',
  'brown',
  'white',
  'black',
  'orange',
];
const nouns = [
  'table',
  'chair',
  'house',
  'bbq',
  'desk',
  'car',
  'pony',
  'cookie',
  'sandwich',
  'burger',
  'pizza',
  'mouse',
  'keyboard',
];

function random(max) {
  return Math.round(Math.random() * 1000) % max;
}

let rowId = 1;
const data = [];
const buildData = (count = 1000) => {
  const newData = [];
  while (newData.length < count) {
    const row = {
      id: rowId++,
      label: `${adjectives[random(adjectives.length)]} ${
        colours[random(colours.length)]
      } ${nouns[random(nouns.length)]}`,
    };
    newData.push(row);
  }
  return newData;
};

const deleteRow = id => {
  const idx = data.findIndex(d => d.id === id);

  data.splice(idx, 1);
  rerender();
};

const run = e => {
  e.preventDefault();
  data.splice(0, data.length, ...buildData(1000));
  rerender();
};
const add = e => {
  e.preventDefault();
  data.splice(data.length, 0, ...buildData(1000));
  rerender();
};
const update = e => {
  e.preventDefault();
  for (let i = 0; i < data.length; i += 10) {
    data[i].label += ' !!!';
  }
  rerender();
};

let selectedRow = null;
const select = id => {
  if (selectedRow !== null) {
    selectedRow.selected = false;
  }
  selectedRow = data.find(row => row.id === id);
  selectedRow.selected = true;
  rerender();
};

const runLots = e => {
  e.preventDefault();
  const newData = buildData(10000);
  data.splice(0, data.length, ...newData);
  rerender();
};
const clear = e => {
  e.preventDefault();
  data.splice(0, data.length);
  rerender();
};
const swapRows = e => {
  e.preventDefault();
  if (data.length > 998) {
    const a = data[1];
    data[1] = data[998];
    data[998] = a;
  }
  rerender();
};

const idKeyFn = ({ id }) => id;

const getAction = (node, stopNode) => {
  while (node !== stopNode) {
    const action = node.dataset.action;
    if (action !== undefined) {
      return action;
    }
    node = node.parentNode;
  }
};
const rowClick = e => {
  e.preventDefault();
  const tr = e.target.closest('tr');
  const action = getAction(e.target, tr);
  if (action === 'delete') {
    const id = parseInt(tr.id);
    deleteRow(id);
  } else if (action === 'select') {
    const id = parseInt(tr.id);
    select(id);
  }
};

const Row = ({ id, label, selected }) => (
  <tr className={selected ? 'danger' : null} id={id}>
    <td className="col-md-1" $textContent={id} />
    <td className="col-md-4">
      <a data-action="select" $textContent={label} />
    </td>
    <td className="col-md-1">
      <a data-action="delete">
        <span className="glyphicon glyphicon-remove" aria-hidden="true" />
      </a>
    </td>
    <td className="col-md-6" />
  </tr>
);

const Main = () => (
  <div className="container">
    <div className="jumbotron">
      <div className="row">
        <div className="col-md-6">
          <h1>React + Mobx</h1>
        </div>
        <div className="col-md-6">
          <div className="row">
            <div className="col-sm-6 smallpad">
              <button
                type="button"
                className="btn btn-primary btn-block"
                id="run"
                $$click={run}
              >
                Create 1,000 rows
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                type="button"
                className="btn btn-primary btn-block"
                id="runlots"
                $$click={runLots}
              >
                Create 10,000 rows
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                type="button"
                className="btn btn-primary btn-block"
                id="add"
                $$click={add}
              >
                Append 1,000 rows
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                type="button"
                className="btn btn-primary btn-block"
                id="update"
                $$click={update}
              >
                Update every 10th row
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                type="button"
                className="btn btn-primary btn-block"
                id="clear"
                $$click={clear}
              >
                Clear
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                type="button"
                className="btn btn-primary btn-block"
                id="swaprows"
                $$click={swapRows}
              >
                Swap Rows
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <table className="table table-hover table-striped test-data">
      <tbody $$click={rowClick}>{repeat(data, idKeyFn, Row)}</tbody>
    </table>
    <span className="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
  </div>
);

const rerender = () => render(<Main />, document.getElementById('main'));
rerender();
