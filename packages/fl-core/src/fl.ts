import { TestResult } from 'fl-addon-core';
import { ExpressionLocation } from 'fl-istanbul-util';

export type Stats = {
  passed: number,
  failed: number
};

export type ExpressionResult = {
  stats: Stats,
  location: ExpressionLocation,
  testedPath: string,
  sourcePath: string,
}

export type FileResult = {
  testedPath: string,
  sourcePath: string,
  expressions: ExpressionResult[],
};

export type Fault = {
  location: ExpressionLocation,
  testedPath: string,
  sourcePath: string,
  score: number | null,
}

const statementStr = (filePath, { start, end }) => {
  return `${filePath}:${start.line}:${start.column}|${end.line}:${end.column}`;
};

export const gatherResults = (testResults: TestResult[]) => {
  const expressionResults: Map<string, ExpressionResult> = new Map();
  for (const testResult of testResults) {
    const coverage = testResult.coverage;
    if (coverage === undefined) {
      continue;
    }
    for (const [filePath, fileCoverage] of Object.entries(coverage) as any) {
      const statementMap = fileCoverage.statementMap;
      for (const statementKey of Object.keys(statementMap)) {
        const executionCount = fileCoverage.s[statementKey];
        if (executionCount === 0) {
          continue;
        }
        const statementCoverage = statementMap[statementKey];
        const hash = statementStr(filePath, statementCoverage);

        const results = (() => {
          if (expressionResults.has(hash)) {
            return expressionResults.get(hash)!;
          } else {
            const passFailCounts = { passed: 0, failed: 0 };
            const newResult: ExpressionResult = {
              location: statementCoverage,
              stats: passFailCounts,
              testedPath: testResult.file,
              sourcePath: fileCoverage.path
            };
            expressionResults.set(hash, newResult);
            return newResult;
          }
        })();
        results.stats[testResult.passed ? 'passed' : 'failed']++;
      }
    }
  }

  const fileResults: Map<string, FileResult> = new Map();
  for(const expressionResult of expressionResults.values()) {
    const { sourcePath, testedPath } = expressionResult;
    if (!fileResults.has(expressionResult.sourcePath)) {
      fileResults.set(sourcePath, {
        sourcePath,
        testedPath,
        expressions: [expressionResult]
      });
    } else {
      const fileResult = fileResults.get(sourcePath)!;
      fileResult.expressions.push(expressionResult);
    }
  }
  return fileResults;
};

export const passFailStatsFromTests = (testResults: TestResult[]): Stats => {
  const stats: Stats = {
    passed: 0,
    failed: 0,
  }
  for(const testResult of testResults) {
    stats[testResult.passed ? 'passed' : 'failed' ]++;
  }
  return stats;
}

export const groupTestsByFilePath = (
  testResults: TestResult[],
) => {
  const grouped: Map<string, TestResult[]> = new Map();
  for(const testResult of testResults) {
    if (!grouped.has(testResult.file)) {
      grouped.set(testResult.file, [testResult]);
    } else {
      const groupedTestResults = grouped.get(testResult.file)!;
      groupedTestResults.push(testResult);
    }
  }
  return grouped;
}

type ScoringFn = (expressionPassFailStats: Stats) => number | null;
export const localiseFaults = (
  groupedTestResults: TestResult[],
  fileResults: Map<string, FileResult>,
  scoringFn: ScoringFn,
): Fault[] => {
  const faults: Fault[] = [];
  const selectedSourceFiles: Set<string> = new Set();
  for(const testResult of groupedTestResults) {
    if (testResult.coverage === undefined) {
      continue;
    }
    for(const coverage of Object.values(testResult.coverage)) {
      selectedSourceFiles.add(coverage.path);
    }
  }
  for(const sourcePath of selectedSourceFiles) {
    const fileResult = fileResults.get(sourcePath)!;
    for(const expression of fileResult.expressions) {
      const { location, sourcePath, testedPath } = expression;
      faults.push({
        sourcePath,
        testedPath,
        location,
        score: scoringFn(expression.stats)
      });
    }
  }
  return faults;
};
