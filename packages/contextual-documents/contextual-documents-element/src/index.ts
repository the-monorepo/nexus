import SuffixElement from '@contextual-documents/suffix-element';
export {
  OverrideHierachyElement,
  pickClassName,
  createStyleRoot,
} from '@contextual-documents/suffix-element';

export type { StyleRoot } from '@contextual-documents/suffix-element';
export { SuffixElement };

abstract class ContextualElement extends SuffixElement {
  constructor(...args: any) {
    super(...args);
  }
}

export default ContextualElement;
