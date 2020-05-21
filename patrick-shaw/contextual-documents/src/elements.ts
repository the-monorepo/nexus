import { createElements } from '@contextual-documents/html-elements';
import styles from '@pshaw/contextual-documents-scss';

import styleRoot from './styleRoot';

export const {
  Header,
  Footer,
  Section,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  P,
  Label,
} = createElements(styleRoot, styles.toString());
