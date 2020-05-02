import SuffixElement from '@semantic-documents/suffix-element';
export {
  OverrideHierachyElement,
  pickClassName,
  createStyleRoot,
 } from '@semantic-documents/suffix-element';

export type { StyleRoot } from '@semantic-documents/suffix-element';
export { SuffixElement };

abstract class SemanticElement extends SuffixElement {
  constructor(...args) {
    super(...args);
  }
}

export default SemanticElement;
