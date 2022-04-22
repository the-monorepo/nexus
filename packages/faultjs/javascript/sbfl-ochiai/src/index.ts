import type { Stats } from '@fault/types';

const ochiai = (
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
