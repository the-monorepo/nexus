import type { PartialConfiguration } from '@biomejs/wasm-nodejs';

/**
 * TypeScript-specific Biome configuration.
 * Equivalent to @pshaw/eslint-config-plugin-typescript
 *
 * Disables some strict rules that are often too noisy for practical use.
 */
export const typescriptConfig: PartialConfiguration = {
  linter: {
    rules: {
      // Disable overly strict TypeScript rules
      suspicious: {
        // Allow explicit any when needed
        noExplicitAny: 'off',
      },
      complexity: {
        // Allow empty functions (useful for interfaces, callbacks, etc.)
        noUselessFragments: 'warn',
      },
      correctness: {
        // Allow unused variables with underscore prefix
        noUnusedVariables: 'warn',
      },
    },
  },
};

export default typescriptConfig;
