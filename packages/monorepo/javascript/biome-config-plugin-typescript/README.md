# @pshaw/biome-config-plugin-typescript

A practical TypeScript style preset for Biome.

## Installation

```bash
npm install @pshaw/biome-config-plugin-typescript @biomejs/js-api @biomejs/wasm-nodejs
```

## Usage

```typescript
import { typescriptConfig } from '@pshaw/biome-config-plugin-typescript';

// Use with @biomejs/js-api
import { Biome } from '@biomejs/js-api';

const biome = await Biome.create();
biome.applyConfiguration(typescriptConfig);
```

## Rules

This config adjusts TypeScript-specific rules:
- Allows `any` type (noExplicitAny: off)
- Warns on unused variables
- Warns on useless fragments
