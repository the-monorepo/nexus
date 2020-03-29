import { SemanticElement, StyleRoot } from '@semantic-documents/element';
import * as types from '@semantic-documents/html5-symbols';

export class H1Element extends SemanticElement {
  constructor(styleRoot: StyleRoot) {
    super(
      styleRoot,
      'h1',
      types.HEADING_1,
    );
  }
}

export class H2Element extends SemanticElement {
  constructor(styleRoot: StyleRoot) {
    super(
      styleRoot,
      'h2',
      types.HEADING_2
    )
  }
}

export class H3Element extends SemanticElement {
  constructor(styleRoot: StyleRoot) {
    super(
      styleRoot,
      'h3',
      types.HEADING_3
    )
  }
}

export class H4Element extends SemanticElement {
  constructor(styleRoot: StyleRoot) {
    super(
      styleRoot,
      'h4',
      types.HEADING_4
    )
  }
}

export class H5Element extends SemanticElement {
  constructor(styleRoot: StyleRoot) {
    super(
      styleRoot,
      'h5',
      types.HEADING_5
    );
  }
}

export class H6Element extends SemanticElement {
  constructor(styleRoot: StyleRoot) {
    super(
      styleRoot,
      'h6',
      types.HEADING_6
    )
  }
}

export class HeaderElement extends SemanticElement {
  constructor(styleRoot: StyleRoot) {
    super(
      styleRoot,
      'header',
      types.HEADER,
    )
  }
}

export class FooterElement extends SemanticElement {
  constructor(styleRoot: StyleRoot) {
    super(
      styleRoot,
      'footer',
      types.FOOTER,
    )
  }
}

export class SectionElement extends SemanticElement {
  constructor(styleRoot: StyleRoot) {
    super(
      styleRoot,
      'section',
      types.SECTION,
    )
  }
}