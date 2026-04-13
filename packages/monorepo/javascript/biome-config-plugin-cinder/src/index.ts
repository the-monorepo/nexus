import type { PartialConfiguration } from "@biomejs/wasm-nodejs";

/**
 * Cinder-specific Biome configuration.
 * Equivalent to @pshaw/eslint-config-plugin-cinder
 *
 * Cinder is a custom JSX pragma, so we disable some React-specific rules
 * that don't apply.
 */
export const cinderConfig: PartialConfiguration = {
	javascript: {
		formatter: {
			// Use double quotes for JSX attributes
			jsxQuoteStyle: "double",
		},
	},
	linter: {
		rules: {
			// Disable React-specific rules that don't apply to Cinder
			correctness: {
				// Cinder doesn't follow React's hook rules
				useExhaustiveDependencies: "off",
			},
			a11y: {
				// Cinder may have different requirements
				noAccessKey: "off",
			},
		},
	},
};

export default cinderConfig;
