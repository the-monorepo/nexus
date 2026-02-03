# @pshaw/biome-config-core

A practical core style preset for Biome.

## Installation

```bash
npm install @pshaw/biome-config-core @biomejs/js-api @biomejs/wasm-nodejs
```

## Usage

```typescript
import { coreConfig } from '@pshaw/biome-config-core';

// Use with @biomejs/js-api
import { Biome } from '@biomejs/js-api';

const biome = await Biome.create();
biome.applyConfiguration(coreConfig);
```

## Rules

This config enables:
- Single quotes
- 2-space indentation
- 90 character line width
- Trailing commas
- `no-var` (error)
- `use-const` (warn)
- `use-template` (error)
- `no-console-log` (warn)
- `no-unused-variables` (warn)
