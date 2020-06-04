# Hook Schema

A package for adding no operation (noop) hooks to incomplete hook objects

## Installation

```bash
npm install --save hook-schema@2.2.4-0
```
or
```bash
yarn add hook-schema@2.2.4-0
```

## Examples

```javascript
import type { Stats } from '@fault/types';

export const ochiai = (
  codeElementTestStateCounts: Stats,
  totalTestStateCounts: Stats,
) => {
  if (totalTestStateCounts.failed === 0) {
    return null;
  }
  if (
    codeElementTestStateCounts.failed === 0 &&
    codeElementTestStateCounts.passed === 0
  ) {
    return null;
  }
  return (
    codeElementTestStateCounts.failed /
    Math.sqrt(
      totalTestStateCounts.failed *
        (codeElementTestStateCounts.failed + codeElementTestStateCounts.passed),
    )
  );
};
export default ochiai;
```

---
This documentation was generated using [writeme](https://www.npmjs.com/package/@writeme/core)
