import { pickClassName, createStyleRoot } from '@semantic-documents/classname-picker';
import type { StyleRoot } from '@semantic-documents/classname-picker';
import createContext from 'dom-context';

export type { StyleRoot };
export { createStyleRoot, pickClassName };

const elementHierachyContext = createContext('element-hierachy');
export class OverrideHierachyElement extends HTMLElement {
  @elementHierachyContext.provider private _hierachy: any[] = [];

  set hierachy(value) {
    this._hierachy = value;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(document.createElement('slot'));
  }
}

abstract class SuffixElement extends HTMLElement {
  private readonly semanticElement: HTMLElement;

  @elementHierachyContext.provider
  private hierachy: any[];

  private semanticType: any;

  constructor(
    private readonly styleRoot: StyleRoot,
    styles: string,
    elementName: string,
    type: any,
  ) {
    super();
    this.semanticType = type;

    const stylesElement = document.createElement('style');
    stylesElement.innerHTML = styles;

    this.semanticElement = document.createElement(elementName);
    this.semanticElement.appendChild(document.createElement('slot'));

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(this.semanticElement);
    shadowRoot.appendChild(stylesElement);

    this.hierachy = [elementName];
  }

  @elementHierachyContext.consumer
  private onHierachyChange(hierachy = []) {
    if (hierachy === undefined) {
      return;
    }
    this.hierachy = [this.semanticType, ...hierachy];
    this.update(this.hierachy);
  }

  update(hierachy) {
    const className = pickClassName(this.styleRoot, hierachy);
    if (className !== undefined) {
      this.semanticElement.setAttribute('class', className);
    } else {
      this.semanticElement.removeAttribute('class');
    }
  }
}

export default SuffixElement;
