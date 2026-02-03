# @pshaw/biome-config-preset

A practical style preset for Biome that combines all config packages.

## Installation

```bash
npm install @pshaw/biome-config-preset @biomejs/js-api @biomejs/wasm-nodejs
```

## Usage

```typescript
import { presetConfig, reactPresetConfig, createConfig } from '@pshaw/biome-config-preset';
import { Biome } from '@biomejs/js-api';

const biome = await Biome.create();

// Use the default preset (core + typescript + cinder)
biome.applyConfiguration(presetConfig);

// Or use the React preset (core + typescript + react)
biome.applyConfiguration(reactPresetConfig);

// Or create a custom combination
import { coreConfig, typescriptConfig } from '@pshaw/biome-config-preset';
const customConfig = createConfig(coreConfig, typescriptConfig);
biome.applyConfiguration(customConfig);
```

## Included Configs

- `@pshaw/biome-config-core` - Core formatting and linting rules
- `@pshaw/biome-config-plugin-typescript` - TypeScript-specific rules
- `@pshaw/biome-config-plugin-react` - React-specific rules
- `@pshaw/biome-config-plugin-cinder` - Cinder (custom JSX pragma) rules

## Presets

- `presetConfig` - Default preset for most projects (core + typescript + cinder)
- `reactPresetConfig` - React preset (core + typescript + react)
