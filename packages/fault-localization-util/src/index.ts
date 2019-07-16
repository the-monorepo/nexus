import { TestResult } from '@fault/types';
import { readFile } from 'mz/fs';
import { Coverage } from '@fault/istanbul-util';

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
    if (testResult.passed) {
      stats.passed++;
    } else {
      stats.failed++;
    }
  }
  return stats;
};
