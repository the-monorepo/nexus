
/// <reference path="global.d.ts" />
import * as mbx from 'mobx-dom';
import benchmarkResults from '../../benchmark-results.json';
const algorithmNames = Object.keys(benchmarkResults.average);
const TableHeader = () => (
  <div>
    <div>rawr?</div>
    {
      algorithmNames.map((algorithmName) => <div>{algorithmName}</div>)
    }
    <div>Rawr?</div>
  </div>
)
const Main = () => (
  <div>
    <TableHeader/>
  </div>
);

mbx.render(<Main />, document.getElementById('root'));
