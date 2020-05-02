import SemanticElement from '@semantic-documents/element';
import type { StyleRoot } from '@semantic-documents/element';

import * as types from '@semantic-documents/html-symbols';

export type { StyleRoot };

export const createElements = (styleRoot: StyleRoot, styles: string) => ({
  H1: class extends SemanticElement {
    constructor() {
      super(styleRoot, styles, 'h1', types.HEADING_1);
    }
  },
  H2: class extends SemanticElement {
    constructor() {
      super(styleRoot, styles, 'h2', types.HEADING_2);
    }
  },
  H3: class extends SemanticElement {
    constructor() {
      super(styleRoot, styles, 'h3', types.HEADING_3);
    }
  },
  H4: class extends SemanticElement {
    constructor() {
      super(styleRoot, styles, 'h4', types.HEADING_4);
    }
  },
  H5: class extends SemanticElement {
    constructor() {
      super(styleRoot, styles, 'h5', types.HEADING_5);
    }
  },
  H6: class extends SemanticElement {
    constructor() {
      super(styleRoot, styles, 'h6', types.HEADING_6);
    }
  },
  P: class extends SemanticElement {
    constructor() {
      super(styleRoot, styles, 'p', types.PARAGRAPH);
    }
  },
  Header: class extends SemanticElement {
    constructor() {
      super(styleRoot, styles, 'header', types.HEADER);
    }
  },
  Footer: class extends SemanticElement {
    constructor() {
      super(styleRoot, styles, 'footer', types.FOOTER);
    }
  },
  Section: class extends SemanticElement {
    constructor() {
      super(styleRoot, styles, 'section', types.SECTION);
    }
  },
  Label: class extends SemanticElement {
    constructor() {
      super(styleRoot, styles, 'label', types.LABEL);
    }
  }
});

export type HTMLSemanticDocumentElements = ReturnType<typeof createElements>;

export const defineCustomElements = (
  prefix: string,
  elements: HTMLSemanticDocumentElements,
) => {
  for (const key of Object.keys(elements)) {
    window.customElements.define(`${prefix}-${key.toLowerCase()}`, elements[key]);
  }
};
