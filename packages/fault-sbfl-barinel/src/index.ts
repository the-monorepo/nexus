import { Stats } from '@fault/addon-sbfl';
export const barinel = (codeElementStats: Stats) => {
  return (
    1 - codeElementStats.passed / (codeElementStats.passed + codeElementStats.failed)
  );
};

export default barinel;
