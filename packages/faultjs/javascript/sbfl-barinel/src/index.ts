import type { Stats } from '@fault/types';
const barinel = (codeElementStats: Stats) => {
  if (codeElementStats.passed + codeElementStats.failed === 0) {
    return null;
  }
  return (
    1 - codeElementStats.passed / (codeElementStats.passed + codeElementStats.failed)
  );
};

export default barinel;
