'use strict';

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

const _textContent$setter = (_element, _value) => (_element.textContent = _value);

const _template = mbx.elementTemplate(
  '<tr><td class="col-md-1"></td><td class="col-md-4"><a data-action="select"></a></td><td class="col-md-1"><a data-action="delete"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></td><td class="col-md-6"></td></tr>',
  _rootNode => {
    const _tr$ = _rootNode;
    const _td$ = _tr$.firstChild;
    const _td$2 = _td$.nextSibling;
    const _a$ = _td$2.firstChild;
    return [
      mbx.attribute(_tr$, 'class'),
      mbx.attribute(_tr$, 'id'),
      mbx.property(_td$, _textContent$setter),
      mbx.property(_a$, _textContent$setter),
    ];
  },
);

const Row = ({ id, label, selected }) =>
  mbx.componentResult(_template, [selected ? 'danger' : null, id, id, label]);

const _template2 = mbx.elementTemplate(
  '<div class="container"><div class="jumbotron"><div class="row"><div class="col-md-6"><h1>React + Mobx</h1></div><div class="col-md-6"><div class="row"><div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block" id="run">Create 1,000 rows</button></div><div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block" id="runlots">Create 10,000 rows</button></div><div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block" id="add">Append 1,000 rows</button></div><div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block" id="update">Update every 10th row</button></div><div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block" id="clear">Clear</button></div><div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block" id="swaprows">Swap Rows</button></div></div></div></div></div><table class="table table-hover table-striped test-data"><tbody></tbody></table><span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span></div>',
  _rootNode2 => {
    const _div$ = _rootNode2;
    const _div$2 = _div$.firstChild;
    const _div$3 = _div$2.firstChild;
    const _div$5 = _div$3.lastChild;
    const _div$6 = _div$5.firstChild;
    const _div$7 = _div$6.firstChild;
    const _button$ = _div$7.firstChild;
    const _div$8 = _div$7.nextSibling;
    const _button$2 = _div$8.firstChild;
    const _div$9 = _div$8.nextSibling;
    const _button$3 = _div$9.firstChild;
    const _div$10 = _div$9.nextSibling;
    const _button$4 = _div$10.firstChild;
    const _div$11 = _div$10.nextSibling;
    const _button$5 = _div$11.firstChild;
    const _div$12 = _div$6.lastChild;
    const _button$6 = _div$12.firstChild;
    const _table$ = _div$2.nextSibling;
    const _tbody$ = _table$.firstChild;
    return [
      mbx.event(_button$, 'click'),
      mbx.event(_button$2, 'click'),
      mbx.event(_button$3, 'click'),
      mbx.event(_button$4, 'click'),
      mbx.event(_button$5, 'click'),
      mbx.event(_button$6, 'click'),
      mbx.event(_tbody$, 'click'),
      mbx.children(_tbody$, null),
    ];
  },
);

const Main = () =>
  mbx.componentResult(_template2, [
    run,
    runLots,
    add,
    update,
    clear,
    swapRows,
    rowClick,
    repeat(data, idKeyFn, Row),
  ]);

const rerender = () => render(Main({}), document.getElementById('main'));

rerender();
