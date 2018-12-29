import { createStyleRoot } from '@contextual-documents/classname-picker';
import * as t from '@contextual-documents/html-symbols';
import * as styles from '@pshaw/contextual-documents-scss';

export const styleRoot = createStyleRoot(
  t.section(styles.section1)(
    t.h1(styles.section1h1)(),

    t.section(styles.section2)(
      t.h1(styles.section2h1)(),

      t.section(styles.section3)(t.h1(styles.section3h1)()),
    ),
  ),
);
