import { createSuffixRoot, matchSuffix, GetChildrenFn, GetValueFn, GetKeyFn, SuffixNode } from 'tree-suffix-mapper'; 
import { MatcherInfo } from '@semantic-documents/matcher-info';

export const getChildren: GetChildrenFn<MatcherInfo> = (node) => node.children;

export const getValue: GetValueFn<MatcherInfo, string> = (node) => node.className;

export const getKey: GetKeyFn<MatcherInfo, Symbol> = (node) => node.type;

export type StyleRoot = SuffixNode<Symbol, string>;

export const createStyleRoot = (...matcherInfoList: MatcherInfo[]): StyleRoot => createSuffixRoot(
  {
    children: getChildren,
    value: getValue,
    key: getKey,
  },
  ...matcherInfoList,
);

export const pickClassName = (styleRoot: StyleRoot, keys: Iterable<Symbol>) => matchSuffix(styleRoot, keys);
