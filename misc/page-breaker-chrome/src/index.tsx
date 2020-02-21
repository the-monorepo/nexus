import * as mbx from 'mobx-dom';
//import { DomElement, rerender } from 'mobx-dom';

const App = () => (
  <div>
    Test
  </div>
);

const rootElement = document.getElementById('root');
mbx.render(<App />, rootElement);
