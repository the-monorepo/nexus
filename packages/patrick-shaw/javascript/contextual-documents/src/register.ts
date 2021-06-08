import { OverrideHierachyElement } from '@contextual-documents/element';
import {
  PShawHeaderElement,
  PShawFooterElement,
  PShawSectionElement,
  PShawH1Element,
  PShawH2Element,
  PShawH3Element,
  PShawH4Element,
  PShawH5Element,
  PShawH6Element,
  PShawLabelElement,
  PShawPElement,
} from './elements.ts';

globalThis.customElements.define('pshaw-header', PShawHeaderElement);
globalThis.customElements.define('pshaw-footer', PShawFooterElement);
globalThis.customElements.define('pshaw-section', PShawSectionElement);
globalThis.customElements.define('pshaw-h1', PShawH1Element);
globalThis.customElements.define('pshaw-h2', PShawH2Element);
globalThis.customElements.define('pshaw-h3', PShawH3Element);
globalThis.customElements.define('pshaw-h4', PShawH4Element);
globalThis.customElements.define('pshaw-h5', PShawH5Element);
globalThis.customElements.define('pshaw-h6', PShawH6Element);
globalThis.customElements.define('pshaw-label', PShawLabelElement);
globalThis.customElements.define('pshaw-p', PShawPElement);

globalThis.customElements.define('pshaw-override-hierachy', OverrideHierachyElement);
