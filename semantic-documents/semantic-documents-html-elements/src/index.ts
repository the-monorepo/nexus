import { SemanticElement, StyleRoot } from '@semantic-documents/element';
import * as types from '@semantic-documents/html-symbols';

export const createElements = (styleRoot: StyleRoot) => ({
  H1: class extends SemanticElement {
    constructor() {
      super(
        styleRoot,
        'h1',
        types.HEADING_1,
      );
    }
  },
  H2: class extends SemanticElement {
    constructor() {
      super(
        styleRoot,
        'h2',
        types.HEADING_2
      )
    }
  },
  H3: class extends SemanticElement {
    constructor() {
      super(
        styleRoot,
        'h3',
        types.HEADING_3
      )
    }
  },
  H4: class extends SemanticElement {
    constructor() {
      super(
        styleRoot,
        'h4',
        types.HEADING_4
      )
    }
  },
  H5: class extends SemanticElement {
    constructor() {
      super(
        styleRoot,
        'h5',
        types.HEADING_5
      );
    }
  },
  H6: class extends SemanticElement {
    constructor() {
      super(
        styleRoot,
        'h6',
        types.HEADING_6
      )
    }
  },
  Header: class extends SemanticElement {
    constructor() {
      super(
        styleRoot,
        'header',
        types.HEADER,
      )
    }
  },
  Footer: class extends SemanticElement {
    constructor() {
      super(
        styleRoot,
        'footer',
        types.FOOTER,
      )
    }
  },
  Section: class extends SemanticElement {
    constructor() {
      super(
        styleRoot,
        'section',
        types.SECTION,
      )
    }
  }
})
