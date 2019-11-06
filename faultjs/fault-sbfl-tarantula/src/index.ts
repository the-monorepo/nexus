import { Stats } from '@fault/types';

export const tarantula = (
  codeElementTestStateCounts: Stats,
  totalTestStateCounts: Stats,
) => {
  if (totalTestStateCounts.failed === 0) {
    return null;
  }
  if ((codeElementTestStateCounts.failed + codeElementTestStateCounts.passed) === 0) {
    return 0;
  }
  return (
    codeElementTestStateCounts.failed /
    totalTestStateCounts.failed /
    (codeElementTestStateCounts.failed / totalTestStateCounts.failed +
      codeElementTestStateCounts.passed / totalTestStateCounts.passed)
  );
};
export default tarantula;
