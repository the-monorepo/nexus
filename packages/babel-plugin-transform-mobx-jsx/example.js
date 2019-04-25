import * as mbx from './mobx-dom';
import { render, repeat } from './mobx-dom';
import { createStore } from './Store';
import { observable, computed } from 'mobx';
let { store, client } = createStore();
const Row = (props) => (
  <tr class={props.data.isSelected ? 'danger' : ''}>
    <td class="col-md-1">{props.data.id}</td>
    <td class="col-md-4">
      <a $onclick={() => { client.select(props.data) }}>{props.data.label}</a>
    </td>
    <td class="col-md-1"><a $onclick={() => client.delete(props.data.id)}><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></td>
    <td class="col-md-6"></td>
  </tr>
)

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
                        <button type="button" class="btn btn-primary btn-block" id="run" $onclick={client.run}>Create 1,000 rows</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="runlots" $onclick={client.runLots}>Create 10,000 rows</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="add" $onclick={client.add}>Append 1,000 rows</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="update" $onclick={client.update}>Update every 10th row</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="clear" $onclick={client.clear}>Clear</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="swaprows" $onclick={client.swapRows}>Swap Rows</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <table class="table table-hover table-striped test-data">
      <tbody>
        {repeat(store.data, (d) => <Row data={d}/>)}
      </tbody>
    </table>
    <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
  </div>
);
render(<Main/>, document.getElementById('main'));