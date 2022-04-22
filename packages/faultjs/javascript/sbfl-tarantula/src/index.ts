import type { Stats } from '@fault/types';

const tarantula = (
  codeElementTestStateCounts: Stats,
  totalTestStateCounts: Stats,
) => {
  if (totalTestStateCounts.failed === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  if (codeElementTestStateCounts.passed + codeElementTestStateCounts.failed === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  const failingPerTotalFailing =
    codeElementTestStateCounts.failed === 0 && totalTestStateCounts.failed === 0
      ? Number.POSITIVE_INFINITY
      : codeElementTestStateCounts.failed / totalTestStateCounts.failed;
  if (failingPerTotalFailing === Number.POSITIVE_INFINITY) {
    return 1;
  }

  const passingPerTotalPassing =
    codeElementTestStateCounts.passed === 0 && totalTestStateCounts.passed === 0
      ? Number.POSITIVE_INFINITY
      : codeElementTestStateCounts.passed / totalTestStateCounts.passed;
  if (passingPerTotalPassing === Number.POSITIVE_INFINITY) {
    return 0;
  }
  const result =
    failingPerTotalFailing / (failingPerTotalFailing + passingPerTotalPassing);
  return result;
};
export default tarantula;
