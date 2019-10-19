import { Stats } from '@fault/types';

export const tarantula = (
  codeElementTestStateCounts: Stats,
  totalTestStateCounts: Stats,
) => {
  return (
    (codeElementTestStateCounts.failed /
    totalTestStateCounts.failed) /
    (codeElementTestStateCounts.failed / totalTestStateCounts.failed +
      codeElementTestStateCounts.passed / totalTestStateCounts.passed)
  );
};
export default tarantula;
