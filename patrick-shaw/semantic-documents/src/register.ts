import { OverrideHierachyElement } from '@semantic-documents/element';
import { defineCustomElements } from '@semantic-documents/html-elements';

import * as elements from './elements';

defineCustomElements('pshaw', elements);
window.customElements.define('pshaw-override-hierachy', OverrideHierachyElement);
