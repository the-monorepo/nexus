import { autorun } from 'mobx';
import * as cinder from 'cinder';

const App = () => (
  <div>Rawr</div>
);

const rerender = () => cinder.render(<App />, document.getElementById('root'));

autorun(rerender);
