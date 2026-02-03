# @pshaw/biome-config-plugin-react

A practical React style preset for Biome.

## Installation

```bash
npm install @pshaw/biome-config-plugin-react @biomejs/js-api @biomejs/wasm-nodejs
```

## Usage

```typescript
import { reactConfig } from '@pshaw/biome-config-plugin-react';

// Use with @biomejs/js-api
import { Biome } from '@biomejs/js-api';

const biome = await Biome.create();
biome.applyConfiguration(reactConfig);
```

## Rules

This config enables React-specific rules:
- Double quotes for JSX attributes
- Warns on missing hook dependencies
- Accessibility rules (alt text, button type, keyboard events)
