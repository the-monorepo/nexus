import { OverrideHierachyElement } from '@contextual-documents/element';
import { PShawHeaderElement, PShawFooterElement, PShawSectionElement, PShawH1Element, PShawH2Element, PShawH3Element, PShawH4Element, PShawH5Element, PShawH6Element, PShawLabelElement, PShawPElement } from './elements';

window.customElements.define('pshaw-header', PShawHeaderElement);
window.customElements.define('pshaw-footer', PShawFooterElement);
window.customElements.define('pshaw-section', PShawSectionElement);
window.customElements.define('pshaw-h1', PShawH1Element);
window.customElements.define('pshaw-h2', PShawH2Element);
window.customElements.define('pshaw-h3', PShawH3Element);
window.customElements.define('pshaw-h4', PShawH4Element);
window.customElements.define('pshaw-h5', PShawH5Element);
window.customElements.define('pshaw-h6', PShawH6Element);
window.customElements.define('pshaw-label', PShawLabelElement);
window.customElements.define('pshaw-p', PShawPElement);;

window.customElements.define('pshaw-override-hierachy', OverrideHierachyElement);
