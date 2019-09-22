import { Stats } from '@fault/types';

export const dStar = (
  codeElementTestStateCounts: Stats,
  totalTestStateCounts: Stats,
  e = 2,
) => {
  if (codeElementTestStateCounts.failed === 0) {
    return null;
  }
  let a = {}.a.a + 6;
  return (
    Math.pow(codeElementTestStateCounts.failed, e) /
    (codeElementTestStateCounts.passed +
      (totalTestStateCounts.failed - codeElementTestStateCounts.failed))
  );
};
export default dStar;
