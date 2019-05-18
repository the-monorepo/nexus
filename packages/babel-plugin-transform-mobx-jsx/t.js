"use strict";

import * as mbx from './mobx-dom';
import { render } from './mobx-dom';
const adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
const colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
const nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];

function random(max) {
  return Math.round(Math.random() * 1000) % max;
}

class RowData {
  constructor(id, label) {
    this.label = label;
    this.id = id;
    this.isSelected = false;
  }

}

let rowId = 1;

const buildData = (count = 1000) => {
  const data = [];

  while (data.length < count) {
    const row = new RowData(rowId++, adjectives[random(adjectives.length)] + " " + colours[random(colours.length)] + " " + nouns[random(nouns.length)]);
    data.push(row);
  }

  return data;
};

const store = {
  data: [],
  selected: null
};

const updateData = () => {
  const data = store.data;

  for (let i = 0; i < data.length; i += 10) {
    data[i].label = data[i].label + ' !!!';
  }
};

const deleteRow = id => {
  const data = store.data;
  const idx = data.findIndex(d => d.id === id);
  data.splice(idx, 1);
};

const run = () => {
  store.data.splice(0, store.data.length, buildData(1000));
  store.selected = null;
  rerender();
};

const add = () => {
  store.data.splice(store.data.length, 0, ...buildData(1000));
  rerender();
};

const update = () => {
  updateData();
  rerender();
};

const select = row => {
  if (store.selected) {
    store.selected.isSelected = false;
  }

  store.selected = row;
  row.isSelected = true;
  rerender();
};

const runLots = () => {
  const newData = buildData(10000);
  store.data.replace(newData);
  store.selected = null;
  rerender();
};

const clear = () => {
  store.data.clear();
  store.selected = null;
  rerender();
};

const swapRows = () => {
  const data = store.data;

  if (data.length > 998) {
    const a = store.data[1];
    data[1] = data[998];
    data[998] = a;
  }

  rerender();
};

const _template$ = mbx.elementTemplate("<tr><td class=\"col-md-1\"></td><td class=\"col-md-4\"><a></a></td><td class=\"col-md-1\"><a><span class=\"glyphicon glyphicon-remove\" aria-hidden=\"true\"></span></a></td><td class=\"col-md-6\"></td></tr>", _root => {
  const _td$ = _root.firstChild;
  const _td$2 = _root.childNodes[1];
  const _a$ = _td$2.firstChild;
  const _td$3 = _root.childNodes[2];
  const _a$2 = _td$3.firstChild;
  return [mbx.attribute(_root, "class"), mbx.property(value => _td$.textContent = value), mbx.event(_a$, "click"), mbx.property(value => _a$.textContent = value), mbx.event(_a$2, "click")];
});

const _template$2 = mbx.elementTemplate("<div class=\"container\"><div class=\"jumbotron\"><div class=\"row\"><div class=\"col-md-6\"><h1>React + Mobx</h1></div><div class=\"col-md-6\"><div class=\"row\"><div class=\"col-sm-6 smallpad\"><button type=\"button\" class=\"btn btn-primary btn-block\" id=\"run\">Create 1,000 rows</button></div><div class=\"col-sm-6 smallpad\"><button type=\"button\" class=\"btn btn-primary btn-block\" id=\"runlots\">Create 10,000 rows</button></div><div class=\"col-sm-6 smallpad\"><button type=\"button\" class=\"btn btn-primary btn-block\" id=\"add\">Append 1,000 rows</button></div><div class=\"col-sm-6 smallpad\"><button type=\"button\" class=\"btn btn-primary btn-block\" id=\"update\">Update every 10th row</button></div><div class=\"col-sm-6 smallpad\"><button type=\"button\" class=\"btn btn-primary btn-block\" id=\"clear\">Clear</button></div><div class=\"col-sm-6 smallpad\"><button type=\"button\" class=\"btn btn-primary btn-block\" id=\"swaprows\">Swap Rows</button></div></div></div></div></div><table class=\"table table-hover table-striped test-data\"><tbody><!----></tbody></table><span class=\"preloadicon glyphicon glyphicon-remove\" aria-hidden=\"true\"></span></div>", _root2 => {
  const _div$ = _root2.firstChild;
  const _div$2 = _div$.firstChild;
  const _div$3 = _div$2.firstChild;
  const _h1$ = _div$3.firstChild;
  const _div$4 = _div$2.childNodes[1];
  const _div$5 = _div$4.firstChild;
  const _div$6 = _div$5.firstChild;
  const _button$ = _div$6.firstChild;
  const _div$7 = _div$5.childNodes[1];
  const _button$2 = _div$7.firstChild;
  const _div$8 = _div$5.childNodes[2];
  const _button$3 = _div$8.firstChild;
  const _div$9 = _div$5.childNodes[3];
  const _button$4 = _div$9.firstChild;
  const _div$10 = _div$5.childNodes[4];
  const _button$5 = _div$10.firstChild;
  const _div$11 = _div$5.childNodes[5];
  const _button$6 = _div$11.firstChild;
  const _table$ = _root2.childNodes[1];
  const _tbody$ = _table$.firstChild;
  const _marker$ = _tbody$.firstChild;
  return [mbx.event(_button$, "click"), mbx.event(_button$2, "click"), mbx.event(_button$3, "click"), mbx.event(_button$4, "click"), mbx.event(_button$5, "click"), mbx.event(_button$6, "click"), mbx.children(_marker$)];
});

const Main = ({
  store
}) => mbx.componentResult(_template$2, [run, runLots, add, update, clear, swapRows, store.data.map(data => {
  const id = data.id;
  return mbx.componentResult(_template$, [data.isSelected ? 'danger' : null, id, () => {
    select(data);
  }, data.label, () => deleteRow(id)]);
})]);

const _template$3 = mbx.elementTemplate("<!---->", _root3 => {
  return [mbx.children(_root3)];
});

const rerender = () => render(mbx.componentResult(_template$3, [Main({
  store: store
})]), document.getElementById('main'));

rerender();
