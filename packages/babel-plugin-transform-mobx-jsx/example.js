import * as mbx from './mobx-dom';
import { render, repeat } from './mobx-dom';

import { observable, action, computed, untracked } from 'mobx';

const adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
const colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
const nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];

function random(max) {
    return Math.round(Math.random() * 1000) % max;
}

class RowData {
    @observable label;
    constructor(id, label, store) {
        this.label = label;
        this.id = id;
        this.store = store;
    }
    @computed get isSelected() {
        return this.store.selected === this;
    }
}

let rowId = 1;
const buildData = (count = 1000) => {
    const data = [];
    for (let i = 0; i < count; i++) {
        const row = new RowData(
            rowId++, 
            adjectives[random(adjectives.length)] +
                " " +
                colours[random(colours.length)] +
                " " +
                nouns[random(nouns.length)],
            store
        );
        data.push(row);
    }
    return data;
};
const store = observable({
    data: [],
    selected: null,
});

const updateData = action(() => {
    const data = store.data;
    for (let i = 0; i < data.length; i += 10) {
        data[i].label = data[i].label + ' !!!';
    }
});
const deleteRow = action((id) => {
    const data = store.data;
    const idx = data.findIndex((d) => d.id === id);

    data.splice(idx, 1);
});
const run = action(() => {
    store.data.replace(buildData(1000));
    store.selected = undefined;
});
const add = action(() => store.data.spliceWithArray(store.data.length, 0, buildData(1000)));
const update = action(() => {
  updateData()
});
const select = action((row) => {
    store.selected = row;
});
const runLots = action(() =>{
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
    if(data.length > 998) {
        const a = store.data[1];
        data[1] = data[998];
        data[998] = a;
    }
})

const Main = () => (
  <div class="container">
    <div class="jumbotron">
        <div class="row">
            <div class="col-md-6">
                <h1>React + Mobx</h1>
            </div>
            <div class="col-md-6">
                <div class="row">
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="run" $onclick={run}>Create 1,000 rows</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="runlots" $onclick={runLots}>Create 10,000 rows</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="add" $onclick={add}>Append 1,000 rows</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="update" $onclick={update}>Update every 10th row</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="clear" $onclick={clear}>Clear</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="swaprows" $onclick={swapRows}>Swap Rows</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <table class="table table-hover table-striped test-data">
      <tbody>
        {repeat(store.data, (data) => {
            const id = untracked(() => data.id);
            return (
              <tr class={data.isSelected ? 'danger' : null}>
                  <td class="col-md-1" $innerHTML={id}/>
                  <td class="col-md-4">
                      <a $onclick={() => { select(data) }} $innerHTML={data.label}/>
                  </td>
                  <td class="col-md-1"><a $onclick={() => deleteRow(id)}><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></td>
                  <td class="col-md-6"/>
              </tr>
            );          
        }
    )}
      </tbody>
    </table>
    <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
  </div>
);
render(<Main/>, document.getElementById('main'));