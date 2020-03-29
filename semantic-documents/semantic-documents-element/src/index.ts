import { SuffixElement, StyleRoot } from '@semantic-documents/suffix-element';

export { StyleRoot };

export abstract class SemanticElement extends SuffixElement {
  constructor(
    styleRoot: StyleRoot,
    elementName: string,
    type?: Symbol,
  ) {
    super(
      styleRoot,
      elementName,
      type,
    );
  }
}

