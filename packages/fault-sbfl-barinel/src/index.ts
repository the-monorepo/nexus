import { Stats } from '@fault/addon-sbfl';
export const barinel = (codeElementStats: Stats) => {
  if (codeElementStats.failed === 0) {
    return null;
  }

  return 1 - (codeElementStats.passed / (codeElementStats.passed + codeElementStats.failed));
}

export default barinel;