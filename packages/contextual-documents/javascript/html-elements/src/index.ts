import {
  HEADER,
  HEADING_1,
  HEADING_2,
  HEADING_3,
  HEADING_4,
  HEADING_5,
  HEADING_6,
  PARAGRAPH,
  FOOTER,
  LABEL,
  SECTION,
} from '@contextual-documents/html-symbols';

import ContextualElement from '@contextual-documents/element';

import type { StyleRoot } from '@contextual-documents/element';

export type { StyleRoot };

export interface HTMLContextualTaggedElement extends ContextualElement {
  new (styleRoot: StyleRoot, styles: string);
}

export class H1Element extends ContextualElement {
  constructor(styleRoot: StyleRoot, styles: string) {
    super(styleRoot, styles, 'h1', HEADING_1);
  }
}

export class H2Element extends ContextualElement {
  constructor(styleRoot: StyleRoot, styles: string) {
    super(styleRoot, styles, 'h2', HEADING_2);
  }
}

export class H3Element extends ContextualElement {
  constructor(styleRoot: StyleRoot, styles: string) {
    super(styleRoot, styles, 'h3', HEADING_3);
  }
}

export class H4Element extends ContextualElement {
  constructor(styleRoot: StyleRoot, styles: string) {
    super(styleRoot, styles, 'h4', HEADING_4);
  }
}

export class H5Element extends ContextualElement {
  constructor(styleRoot: StyleRoot, styles: string) {
    super(styleRoot, styles, 'h5', HEADING_5);
  }
}

export class H6Element extends ContextualElement {
  constructor(styleRoot: StyleRoot, styles: string) {
    super(styleRoot, styles, 'h6', HEADING_6);
  }
}

export class PElement extends ContextualElement {
  constructor(styleRoot: StyleRoot, styles: string) {
    super(styleRoot, styles, 'p', PARAGRAPH);
  }
}

export class HeaderElement extends ContextualElement {
  constructor(styleRoot: StyleRoot, styles: string) {
    super(styleRoot, styles, 'header', HEADER);
  }
}

export class FooterElement extends ContextualElement {
  constructor(styleRoot: StyleRoot, styles: string) {
    super(styleRoot, styles, 'footer', FOOTER);
  }
}

export class SectionElement extends ContextualElement {
  constructor(styleRoot: StyleRoot, styles: string) {
    super(styleRoot, styles, 'section', SECTION);
  }
}

export class LabelElement extends ContextualElement {
  constructor(styleRoot: StyleRoot, styles: string) {
    super(styleRoot, styles, 'label', LABEL);
  }
}
