import type { Stats } from '@fault/types';

const dStar = (
  codeElementTestStateCounts: Stats,
  totalTestStateCounts: Stats,
  e = 2,
) => {
  if (
    codeElementTestStateCounts.passed +
      (totalTestStateCounts.failed - codeElementTestStateCounts.failed) ===
    0
  ) {
    return null;
  }
  return (
    Math.pow(codeElementTestStateCounts.failed, e) /
    (codeElementTestStateCounts.passed +
      (totalTestStateCounts.failed - codeElementTestStateCounts.failed))
  );
};
export default dStar;
