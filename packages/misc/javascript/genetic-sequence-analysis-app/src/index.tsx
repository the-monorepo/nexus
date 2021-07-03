import * as cinder from 'cinder';
import '@pshaw/contextual-documents';
import '@polymer/paper-radio-button/paper-radio-button';
import { parseFormatObjects } from 'fasta-format-parser';
async function* test() {
  for (const char of '>lcl|test|ATGC') {
    yield char;
  }
}

const App = () => (
  <>
    <pshaw-h1>Character sequencer</pshaw-h1>
    <paper-radio-button
      $$click={async (e) => {
        e.preventDefault();
        for await (const value of parseFormatObjects(test())) {
          // eslint-disable-next-line no-console
          console.log(value);
        }
      }}
    >
      Test
    </paper-radio-button>
  </>
);

cinder.render(<App />, document.getElementById('root'));
