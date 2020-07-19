import { OverrideHierachyElement } from '@contextual-documents/element';
import * as ElementClassRecord from './elements';

for (const [key, ElementClass] of Object.entries(ElementClassRecord)) {
  customElements.define(`pshaw-${key.toString()}`, ElementClass);  
}
window.customElements.define('pshaw-override-hierachy', OverrideHierachyElement);
