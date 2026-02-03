import type { PartialConfiguration } from '@biomejs/wasm-nodejs';
import { coreConfig } from '@pshaw/biome-config-core';
import { typescriptConfig } from '@pshaw/biome-config-plugin-typescript';
import { reactConfig } from '@pshaw/biome-config-plugin-react';
import { cinderConfig } from '@pshaw/biome-config-plugin-cinder';

// Re-export the type for convenience
export type { PartialConfiguration as BiomeConfiguration } from '@biomejs/wasm-nodejs';

// Re-export individual configs
export { coreConfig } from '@pshaw/biome-config-core';
export { typescriptConfig } from '@pshaw/biome-config-plugin-typescript';
export { reactConfig } from '@pshaw/biome-config-plugin-react';
export { cinderConfig } from '@pshaw/biome-config-plugin-cinder';

/**
 * Deep merge configuration objects.
 * Later configs override earlier ones.
 */
function deepMerge<T extends Record<string, unknown>>(...objects: Partial<T>[]): T {
  const result: Record<string, unknown> = {};

  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        result[key] !== null &&
        typeof result[key] === 'object' &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(
          result[key] as Record<string, unknown>,
          value as Record<string, unknown>,
        );
      } else {
        result[key] = value;
      }
    }
  }

  return result as T;
}

/**
 * Creates a merged Biome configuration from the provided configs.
 */
export function createConfig(...configs: PartialConfiguration[]): PartialConfiguration {
  return deepMerge<PartialConfiguration>(...configs);
}

/**
 * Default preset configuration.
 * Combines core + typescript + cinder configs.
 */
export const presetConfig = createConfig(coreConfig, typescriptConfig, cinderConfig);

/**
 * React preset configuration.
 * Combines core + typescript + react configs.
 */
export const reactPresetConfig = createConfig(coreConfig, typescriptConfig, reactConfig);

export default presetConfig;
