import { Stats } from '@fault/types';

export const ochiai = (
  codeElementTestStateCounts: Stats,
  totalTestStateCounts: Stats,
) => {
  if (codeElementTestStateCounts.failed === 0) {
    return null;
  }
  return (
    codeElementTestStateCounts.failed /
    Math.sqrt(
      (codeElementTestStateCounts.failed + totalTestStateCounts.failed) *
        (codeElementTestStateCounts.failed + codeElementTestStateCounts.passed),
    )
  );
};
export default ochiai;
