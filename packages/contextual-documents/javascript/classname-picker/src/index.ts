import type { MatcherInfo } from "@contextual-documents/matcher-info";
import {
	type GetChildrenFn,
	type GetKeyFn,
	type GetValueFn,
	type SuffixNode,
	createSuffixRoot,
	matchSuffix,
} from "tree-suffix-mapper";

export const getChildren: GetChildrenFn<MatcherInfo> = (node) => node.children;

export const getValue: GetValueFn<MatcherInfo, string> = (node) =>
	node.className;

export const getKey: GetKeyFn<MatcherInfo, symbol> = (node) => node.type;

export type StyleRoot = SuffixNode<symbol, string>;

export const createStyleRoot = (...matcherInfoList: MatcherInfo[]): StyleRoot =>
	createSuffixRoot(
		{
			children: getChildren,
			value: getValue,
			key: getKey,
		},
		...matcherInfoList,
	);

export const pickClassName = (styleRoot: StyleRoot, keys: Iterable<symbol>) =>
	matchSuffix(styleRoot, keys);
