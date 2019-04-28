import * as mbx from './mobx-dom';
import { render, repeat } from './mobx-dom';
import { createStore } from './Store';
import { observable, computed } from 'mobx';
let { store, client } = createStore();
const Row = props => (
  <tr className={props.data.isSelected ? 'danger' : ''}>
    <td className="col-md-1">{props.data.id}</td>
    <td className="col-md-4">
      <a
        $onclick={() => {
          client.select(props.data);
        }}
      >
        {props.data.label}
      </a>
    </td>
    <td className="col-md-1">
      <a $onclick={() => client.delete(props.data.id)}>
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
                $onclick={client.run}
              >
                Create 1,000 rows
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                type="button"
                className="btn btn-primary btn-block"
                id="runlots"
                $onclick={client.runLots}
              >
                Create 10,000 rows
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                type="button"
                className="btn btn-primary btn-block"
                id="add"
                $onclick={client.add}
              >
                Append 1,000 rows
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                type="button"
                className="btn btn-primary btn-block"
                id="update"
                $onclick={client.update}
              >
                Update every 10th row
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                type="button"
                className="btn btn-primary btn-block"
                id="clear"
                $onclick={client.clear}
              >
                Clear
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                type="button"
                className="btn btn-primary btn-block"
                id="swaprows"
                $onclick={client.swapRows}
              >
                Swap Rows
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <table className="table table-hover table-striped test-data">
      <tbody>
        {repeat(store.data, d => (
          <Row data={d} />
        ))}
      </tbody>
    </table>
    <span className="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
  </div>
);
render(<Main />, document.getElementById('main'));
