import styles from '@pshaw/semantic-documents-scss';
import { createElements } from '@semantic-documents/html-elements';

import styleRoot from './styleRoot';

export const { Header, Footer, Section, H1, H2, H3, H4, H5, H6, P } = createElements(
  styleRoot,
  styles.toString(),
);
