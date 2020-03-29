import { pickClassName, StyleRoot, createStyleRoot } from '@semantic-documents/suffix-matcher';
import cx from 'classnames';

export { createStyleRoot, StyleRoot };

export const SEMANTIC_TYPE = Symbol('semantic-type');
export function* traverseUpDomTreeAndYieldSemanticTypes(node: Node, ignoreBoundaries: boolean): Generator<Symbol> {
  let current: Node | null = node;
  while (current !== null) {
    if (current[SEMANTIC_TYPE] !== undefined) {
      yield current[SEMANTIC_TYPE];
    }
    if (current instanceof HTMLElement) {
      current = current.parentNode;
    } else if (current instanceof ShadowRoot && ignoreBoundaries) {
      current = current.host;
    } else {
      break;
    }
  }
}

const IGNORE_BOUNDARIES_ATTRIBUTE = 'ignore-boundaries';
export abstract class SemanticElement extends HTMLElement {
  private readonly semanticElement: HTMLElement;

  constructor(
    private readonly styleRoot: StyleRoot,
    type: Symbol,
    elementName: string,
  ) {
    super();
    this[SEMANTIC_TYPE] = type;

    this.semanticElement = document.createElement(elementName);

    this.attachShadow({ mode: 'open' })
      .appendChild(this.semanticElement);
  }

  recalcSemanticClassName(): string | undefined {
    const domIterator = traverseUpDomTreeAndYieldSemanticTypes(this, this.ignoreBoundaries);
    const semanticClassName = pickClassName(this.styleRoot, domIterator);
    return semanticClassName;
  }

  private updateClassName() {
    this.semanticElement.setAttribute('class', cx(this.recalcSemanticClassName()));
  }

  get ignoreBoundaries() {
    return this.hasAttribute(IGNORE_BOUNDARIES_ATTRIBUTE);
  }

  static get observedAttributes() {
    return [IGNORE_BOUNDARIES_ATTRIBUTE];
  }

  attributeChangedCallback(name) {
    if (name === IGNORE_BOUNDARIES_ATTRIBUTE) {
      this.updateClassName();
    }
  }

  connectedCallback() {
    if (this.isConnected) {
      this.updateClassName();
    }
  }
}