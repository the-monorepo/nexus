import * as mbx from 'mobx-dom';

import { Collapsible } from './Collapsible';

const App = () => (
  <div>
    <Collapsible>
      Test
    </Collapsible>
  </div>
);

const rootElement = document.getElementById('root');
mbx.render(<App />, rootElement);
