import * as cinder from 'cinder';
import '@pshaw/contextual-documents';
import '@polymer/paper-radio-button/paper-radio-button';

const App = () => (
  <>
    <pshaw-h1>Character sequencer</pshaw-h1>
    <paper-radio-button>Text</paper-radio-button>
  </>
);

cinder.render(<App />, document.getElementById('root'));