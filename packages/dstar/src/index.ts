export type Stats = {
  failed: number;
  passed: number;
};

export const dStar = (
  codeElementTestStateCounts: Stats,
  totalTestStateCounts: Stats,
  e = 2,
) => {
  if (codeElementTestStateCounts.failed === 0) {
    return null;
  }
  return (
    Math.pow(codeElementTestStateCounts.failed, e) /
    (codeElementTestStateCounts.passed +
      (totalTestStateCounts.failed - codeElementTestStateCounts.failed))
  );
};
