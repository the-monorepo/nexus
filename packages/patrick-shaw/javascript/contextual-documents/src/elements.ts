import {
  HeaderElement,
  FooterElement,
  SectionElement,
  H1Element,
  H2Element,
  H3Element,
  H4Element,
  H5Element,
  H6Element,
  PElement,
  LabelElement,
} from '@contextual-documents/html-elements';
import styles from '@pshaw/contextual-documents-scss';

import styleRoot from './styleRoot.ts';

const styleString = styles.toString();
export class PShawHeaderElement extends HeaderElement {
  constructor() {
    super(styleRoot, styleString);
  }
}

export class PShawFooterElement extends FooterElement {
  constructor() {
    super(styleRoot, styleString);
  }
}

export class PShawSectionElement extends SectionElement {
  constructor() {
    super(styleRoot, styleString);
  }
}

export class PShawH1Element extends H1Element {
  constructor() {
    super(styleRoot, styleString);
  }
}

export class PShawH2Element extends H2Element {
  constructor() {
    super(styleRoot, styleString);
  }
}

export class PShawH3Element extends H3Element {
  constructor() {
    super(styleRoot, styleString);
  }
}

export class PShawH4Element extends H4Element {
  constructor() {
    super(styleRoot, styleString);
  }
}

export class PShawH5Element extends H5Element {
  constructor() {
    super(styleRoot, styleString);
  }
}

export class PShawH6Element extends H6Element {
  constructor() {
    super(styleRoot, styleString);
  }
}

export class PShawPElement extends PElement {
  constructor() {
    super(styleRoot, styleString);
  }
}

export class PShawLabelElement extends LabelElement {
  constructor() {
    super(styleRoot, styleString);
  }
}
