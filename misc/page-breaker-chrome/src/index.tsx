import './unstyled.scss';
import * as mbx from 'mobx-dom';
import './globals.scss';
import styles from './styles.scss';
import text from './typography.scss';
const Icon = ({ children }) => (
  <span class="material-icons">{children}</span>
);

const Button = ({ children }) => (
  <button class={styles.button}>{children}</button>
);

const SelectAndDragIcon = () => (
  <Icon>photo_size_select_small</Icon>
);

const AppHeadingH1 = ({ children }) => (
  <h1 class={text.h700}>{children}</h1>
);

const FunctionHeadingH1 = ({ children }) => (
  <h1 class={text.h600}>{children}</h1>
);

const App = () => (
  <div>
    <AppHeadingH1>Page breaker</AppHeadingH1>
    <section>
      <FunctionHeadingH1>Replace words</FunctionHeadingH1>
      <Button><SelectAndDragIcon /></Button>
    </section>
  </div>
)

const rootElement = document.getElementById('root');
mbx.render(<App />, rootElement);
