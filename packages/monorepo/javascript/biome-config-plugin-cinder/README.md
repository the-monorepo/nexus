# @pshaw/biome-config-plugin-cinder

A practical Cinder style preset for Biome.

Cinder is a custom JSX pragma, so this config disables React-specific rules that don't apply.

## Installation

```bash
npm install @pshaw/biome-config-plugin-cinder @biomejs/js-api @biomejs/wasm-nodejs
```

## Usage

```typescript
import { cinderConfig } from '@pshaw/biome-config-plugin-cinder';

// Use with @biomejs/js-api
import { Biome } from '@biomejs/js-api';

const biome = await Biome.create();
biome.applyConfiguration(cinderConfig);
```

## Rules

This config adjusts rules for Cinder:
- Double quotes for JSX attributes
- Disables React-specific hook rules
- Relaxed accessibility rules for Cinder components
