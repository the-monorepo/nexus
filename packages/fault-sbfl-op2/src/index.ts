import { Stats } from '@fault/types';

export const op2 = (codeElementTestStateCounts: Stats, totalTestStateCounts: Stats) => {
  if (codeElementTestStateCounts.failed === 0) {
    return null;
  }
  return (
    codeElementTestStateCounts.failed -
    codeElementTestStateCounts.passed / (totalTestStateCounts.passed + 1)
  );
};
export default op2;
