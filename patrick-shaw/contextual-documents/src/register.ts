import { OverrideHierachyElement } from '@contextual-documents/element';
import { defineCustomElements } from '@contextual-documents/html-elements';

import * as elements from './elements';

defineCustomElements('pshaw', elements);
window.customElements.define('pshaw-override-hierachy', OverrideHierachyElement);
