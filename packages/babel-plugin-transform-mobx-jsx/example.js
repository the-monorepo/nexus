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
    while(data.length < count) {
        const row = new RowData(
            rowId++, 
            adjectives[random(adjectives.length)] +
                " " +
                colours[random(colours.length)] +
                " " +
                nouns[random(nouns.length)]
        );
        data.push(row);
    }
    return data;
};
const store = {
    data: [],
    selected: null,
};

const updateData = () => {
    const data = store.data;
    for (let i = 0; i < data.length; i += 10) {
        data[i].label = data[i].label + ' !!!';
    }
};
const deleteRow = (id) => {
    const data = store.data;
    const idx = data.findIndex((d) => d.id === id);

    data.splice(idx, 1);
};

const run = () => {
    store.data.splice(0, store.data.length, buildData(1000));
    store.selected = null;
    rerender();
};
const add = () => {
    store.data.splice(store.data.length, 0, ...buildData(1000))
    rerender();
};
const update = () => {
  updateData()
  rerender();
};
const select = (row) => {
    if(store.selected) {
        store.selected.isSelected = false;
    }
    store.selected = row;
    row.isSelected = true;
    rerender();
};
const runLots = () =>{
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
    if(data.length > 998) {
        const a = store.data[1];
        data[1] = data[998];
        data[998] = a;
    }
    rerender();
};

const Main = ({ store }) => (
  <div class="container">
    <div class="jumbotron">
        <div class="row">
            <div class="col-md-6">
                <h1>React + Mobx</h1>
            </div>
            <div class="col-md-6">
                <div class="row">
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="run" $$click={run}>Create 1,000 rows</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="runlots" $$click={runLots}>Create 10,000 rows</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="add" $$click={add}>Append 1,000 rows</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="update" $$click={update}>Update every 10th row</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="clear" $$click={clear}>Clear</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="swaprows" $$click={swapRows}>Swap Rows</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <table class="table table-hover table-striped test-data">
      <tbody>
        {store.data.map((data) => {
            const id = data.id;
            return (
              <tr class={data.isSelected ? 'danger' : null}>
                  <td class="col-md-1" $textContent={id}/>
                  <td class="col-md-4">
                      <a $$click={() => { select(data) }} $textContent={data.label}/>
                  </td>
                  <td class="col-md-1"><a $$click={() => deleteRow(id)}><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></td>
                  <td class="col-md-6"/>
              </tr>
            );          
        })}
      </tbody>
    </table>
    <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
  </div>
);

const rerender = () => render(<Main store={store}/>, document.getElementById('main'));
rerender();