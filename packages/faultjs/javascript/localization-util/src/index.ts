import { TestResult } from '@fault/types';

export type Stats = {
  passed: number;
  failed: number;
};

export const passFailStatsFromTests = (testResults: Iterable<TestResult>): Stats => {
  const stats: Stats = {
    passed: 0,
    failed: 0,
  };
  for (const testResult of testResults) {
    if (testResult.data.passed) {
      stats.passed++;
    } else {
      stats.failed++;
    }
  }
  return stats;
};
