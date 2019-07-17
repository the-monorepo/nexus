import { Stats } from '@fault/types';

export const tarantula = (
  codeElementTestStateCounts: Stats,
  totalTestStateCounts: Stats,
) => {
  if (codeElementTestStateCounts.failed === 0) {
    return null;
  }
  return (codeElementTestStateCounts.failed / totalTestStateCounts.failed) / 
    (codeElementTestStateCounts.failed / totalTestStateCounts.failed + codeElementTestStateCounts.passed / totalTestStateCounts.passed)
};
export default tarantula;