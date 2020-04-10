import * as t from '@semantic-documents/html-symbols';
import { createStyleRoot } from '@semantic-documents/classname-picker';
import styles from '@pshaw/semantic-documents-scss';

const styleRoot = createStyleRoot(
  t.section(styles.locals.section1)(
    t.h1(styles.locals.section1h1)(),

    t.section(styles.locals.section2)(
      t.h1(styles.locals.section2h1)(),

      t.section(styles.locals.section3)(
        t.h1(styles.locals.section3h1)()
      )
    )
  )
);

export default styleRoot;
