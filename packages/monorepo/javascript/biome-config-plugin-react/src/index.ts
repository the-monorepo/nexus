import type { PartialConfiguration } from "@biomejs/wasm-nodejs";

/**
 * React-specific Biome configuration.
 * Equivalent to @pshaw/eslint-config-plugin-react
 */
export const reactConfig: PartialConfiguration = {
	javascript: {
		formatter: {
			// Use double quotes for JSX attributes
			jsxQuoteStyle: "double",
		},
	},
	linter: {
		rules: {
			correctness: {
				// Warn on missing dependencies in hooks
				useExhaustiveDependencies: "warn",
			},
			a11y: {
				// Enable accessibility rules for React
				useAltText: "warn",
				useButtonType: "warn",
				useKeyWithClickEvents: "warn",
			},
		},
	},
};

export default reactConfig;
