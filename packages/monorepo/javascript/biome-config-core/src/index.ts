import type { PartialConfiguration } from '@biomejs/wasm-nodejs';

// Re-export the type for convenience
export type { PartialConfiguration as BiomeConfiguration } from '@biomejs/wasm-nodejs';

/**
 * Core Biome configuration with essential rules.
 * Equivalent to @pshaw/eslint-config-core
 */
export const coreConfig: PartialConfiguration = {
  formatter: {
    enabled: true,
    indentStyle: 'space',
    indentWidth: 2,
    lineWidth: 90,
  },
  javascript: {
    formatter: {
      quoteStyle: 'single',
      trailingCommas: 'all',
    },
  },
  linter: {
    enabled: true,
    rules: {
      recommended: true,
      style: {
        noVar: 'error',
        useConst: 'warn',
        useTemplate: 'error',
      },
      suspicious: {
        noDebugger: 'error',
        noConsoleLog: 'warn',
      },
      correctness: {
        noUnusedVariables: 'warn',
      },
    },
  },
  organizeImports: {
    enabled: true,
  },
};

export default coreConfig;
