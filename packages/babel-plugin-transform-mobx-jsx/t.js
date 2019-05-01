"use strict";

var _class, _descriptor, _temp;

function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

import * as mbx from './mobx-dom';
import { render, repeat } from './mobx-dom';
import { observable, action, computed, untracked } from 'mobx';
const adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
const colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
const nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];

function random(max) {
  return Math.round(Math.random() * 1000) % max;
}

let RowData = (_class = (_temp = class RowData {
  constructor(id, label, store) {
    _initializerDefineProperty(this, "label", _descriptor, this);

    this.label = label;
    this.id = id;
    this.store = store;
  }

  get isSelected() {
    return this.store.selected === this;
  }

}, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "label", [observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _applyDecoratedDescriptor(_class.prototype, "isSelected", [computed], Object.getOwnPropertyDescriptor(_class.prototype, "isSelected"), _class.prototype)), _class);
let rowId = 1;

const buildData = (count = 1000) => {
  const data = [];

  for (let i = 0; i < count; i++) {
    const row = new RowData(rowId++, adjectives[random(adjectives.length)] + " " + colours[random(colours.length)] + " " + nouns[random(nouns.length)], store);
    data.push(row);
  }

  return data;
};

const store = observable({
  data: [],
  selected: null
});
const updateData = action(() => {
  const data = store.data;

  for (let i = 0; i < data.length; i += 10) {
    data[i].label = data[i].label + ' !!!';
  }
});
const deleteRow = action(id => {
  const data = store.data;
  const idx = data.findIndex(d => d.id === id);
  data.splice(idx, 1);
});
const run = action(() => {
  store.data.replace(buildData(1000));
  store.selected = undefined;
});
const add = action(() => store.data.spliceWithArray(store.data.length, 0, buildData(1000)));
const update = action(() => {
  updateData();
});
const select = action(row => {
  store.selected = row;
});
const runLots = action(() => {
  const newData = buildData(10000);
  store.data.replace(newData);
  store.selected = undefined;
});
const clear = action(() => {
  store.data.clear();
  store.selected = undefined;
});
const swapRows = action(() => {
  const data = store.data;

  if (data.length > 998) {
    const a = store.data[1];
    data[1] = data[998];
    data[998] = a;
  }
});

const _template$ = mbx.elementTemplate("<tr><td class=\"col-md-1\"></td><td class=\"col-md-4\"><a></a></td><td class=\"col-md-1\"><a><span class=\"glyphicon glyphicon-remove\" aria-hidden=\"true\"></span></a></td><td class=\"col-md-6\"></td></tr>");

const _template$2 = mbx.elementTemplate("<div class=\"container\"><div class=\"jumbotron\"><div class=\"row\"><div class=\"col-md-6\"><h1>React + Mobx</h1></div><div class=\"col-md-6\"><div class=\"row\"><div class=\"col-sm-6 smallpad\"><button type=\"button\" class=\"btn btn-primary btn-block\" id=\"run\">Create 1,000 rows</button></div><div class=\"col-sm-6 smallpad\"><button type=\"button\" class=\"btn btn-primary btn-block\" id=\"runlots\">Create 10,000 rows</button></div><div class=\"col-sm-6 smallpad\"><button type=\"button\" class=\"btn btn-primary btn-block\" id=\"add\">Append 1,000 rows</button></div><div class=\"col-sm-6 smallpad\"><button type=\"button\" class=\"btn btn-primary btn-block\" id=\"update\">Update every 10th row</button></div><div class=\"col-sm-6 smallpad\"><button type=\"button\" class=\"btn btn-primary btn-block\" id=\"clear\">Clear</button></div><div class=\"col-sm-6 smallpad\"><button type=\"button\" class=\"btn btn-primary btn-block\" id=\"swaprows\">Swap Rows</button></div></div></div></div></div><table class=\"table table-hover table-striped test-data\"><tbody><!----></tbody></table><span class=\"preloadicon glyphicon glyphicon-remove\" aria-hidden=\"true\"></span></div>");

const Main = () => function () {
  const _root$2 = _template$2();

  const _div$ = _root$2.firstChild;
  const _div$2 = _div$.firstChild;
  const _div$3 = _div$2.firstChild;
  const _h1$ = _div$3.firstChild;
  const _div$4 = _div$2.childNodes[1];
  const _div$5 = _div$4.firstChild;
  const _div$6 = _div$5.firstChild;
  const _button$ = _div$6.firstChild;
  _button$.onclick = run;
  const _div$7 = _div$5.childNodes[1];
  const _button$2 = _div$7.firstChild;
  _button$2.onclick = runLots;
  const _div$8 = _div$5.childNodes[2];
  const _button$3 = _div$8.firstChild;
  _button$3.onclick = add;
  const _div$9 = _div$5.childNodes[3];
  const _button$4 = _div$9.firstChild;
  _button$4.onclick = update;
  const _div$10 = _div$5.childNodes[4];
  const _button$5 = _div$10.firstChild;
  _button$5.onclick = clear;
  const _div$11 = _div$5.childNodes[5];
  const _button$6 = _div$11.firstChild;
  _button$6.onclick = swapRows;
  const _table$ = _root$2.childNodes[1];
  const _tbody$ = _table$.firstChild;
  const _marker$ = _tbody$.firstChild;
  return mbx.componentRoot(_root$2, [mbx.children(_marker$, () => repeat(store.data, data => {
    const id = untracked(() => data.id);
    return function () {
      const _root$ = _template$();

      const _td$ = _root$.firstChild;
      _td$.innerHTML = id;
      const _td$2 = _root$.childNodes[1];
      const _a$ = _td$2.firstChild;

      _a$.onclick = () => {
        select(data);
      };

      const _td$3 = _root$.childNodes[2];
      const _a$2 = _td$3.firstChild;

      _a$2.onclick = () => deleteRow(id);

      return mbx.componentRoot(_root$, [mbx.fields(_root$, mbx.field(mbx.ATTR_TYPE, "class", () => data.isSelected ? 'danger' : null)), mbx.fields(_a$, mbx.field(mbx.PROP_TYPE, "innerHTML", () => data.label))]);
    }();
  }))]);
}();

const _template$3 = mbx.elementTemplate("<!---->");

render(function () {
  const _root$3 = _template$3();

  return mbx.componentRoot(_root$3, [mbx.subComponent(Main, _root$3, undefined, undefined)]);
}(), document.getElementById('main'));
