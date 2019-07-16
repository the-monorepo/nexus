import { TestResult, TesterResults } from '@fault/types';
import { ExpressionLocation } from '@fault/istanbul-util';
import { PartialTestHookOptions } from '@fault/addon-hook-schema';
import { relative } from 'path';
import { readFile } from 'mz/fs';
import { recordFaults } from '@fault/record-faults';
import dStar from '@fault/sbfl-dstar'; 
import chalk from 'chalk';
export type Stats = {
  passed: number;
  failed: number;
};

export type ExpressionResult = {
  stats: Stats;
  location: ExpressionLocation;
  testedPath: string;
  sourcePath: string;
};

export type FileResult = {
  testedPath: string;
  sourcePath: string;
  expressions: ExpressionResult[];
};

export type ScorelessFault = {
  location: ExpressionLocation;
  testedPath: string;
  sourcePath: string;
}

export type Fault = {
  score: number | null;
} & ScorelessFault;

const statementStr = (filePath, { start, end }) => {
  return `${filePath}:${start.line}:${start.column}|${end.line}:${end.column}`;
};

export const gatherResults = (testResults: Iterable<TestResult>) => {
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
              sourcePath: fileCoverage.path,
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
  for (const expressionResult of expressionResults.values()) {
    const { sourcePath, testedPath } = expressionResult;
    if (!fileResults.has(expressionResult.sourcePath)) {
      fileResults.set(sourcePath, {
        sourcePath,
        testedPath,
        expressions: [expressionResult],
      });
    } else {
      const fileResult = fileResults.get(sourcePath)!;
      fileResult.expressions.push(expressionResult);
    }
  }
  return fileResults;
};

export const passFailStatsFromTests = (testResults: Iterable<TestResult>): Stats => {
  const stats: Stats = {
    passed: 0,
    failed: 0,
  };
  for (const testResult of testResults) {
    stats[testResult.passed ? 'passed' : 'failed']++;
  }
  return stats;
};

type InternalScoringFn = (expressionPassFailStats: Stats) => number | null;
type ExternalScoringFn = (expressionPassFailStats: Stats, totalPassFailStats: Stats) => number | null;
export type ScoringFn = ExternalScoringFn;
export const localizeFaults = (
  groupedTestResults: Iterable<TestResult>,
  fileResults: Map<string, FileResult>,
  scoringFn: InternalScoringFn,
): Fault[] => {
  const faults: Fault[] = [];
  const selectedSourceFiles: Set<string> = new Set();
  for (const testResult of groupedTestResults) {
    if (testResult.coverage === undefined) {
      continue;
    }
    for (const coverage of Object.values(testResult.coverage)) {
      selectedSourceFiles.add(coverage.path);
    }
  }
  for (const sourcePath of selectedSourceFiles) {
    const fileResult = fileResults.get(sourcePath)!;
    for (const expression of fileResult.expressions) {
      const { location, sourcePath, testedPath } = expression;
      faults.push({
        sourcePath,
        testedPath,
        location,
        score: scoringFn(expression.stats),
      });
    }
  }
  return faults;
};

const simplifyPath = absoluteFilePath => relative(process.cwd(), absoluteFilePath);

const reportFaults = async (faults: Fault[], scoringFn: ExternalScoringFn) => {
  const rankedFaults = faults
    .filter(fault => fault.score !== null)
    .sort((f1, f2) => f2.score! - f1.score!)
    .slice(0, 10);
  for (const fault of rankedFaults) {
    const lines = (await readFile(fault.sourcePath, 'utf8')).split('\n');
    console.log(
      `${simplifyPath(fault.sourcePath)}:${fault.location.start.line}:${
        fault.location.start.column
      }, ${chalk.cyan(fault.score!.toString())}`,
    );
    let l = fault.location.start.line - 1;
    let lineCount = 0;
    const maxLineCount = 3;
    while (l < fault.location.end.line - 1 && lineCount < maxLineCount) {
      console.log(chalk.grey(lines[l++]));
      lineCount++;
    }
    const lastLine = lines[l++];
    console.log(chalk.grey(lastLine));
    if (lineCount >= maxLineCount) {
      const spaces = lastLine.match(/^ */)![0];
      console.log(chalk.grey(`${new Array(spaces.length + 1).join(' ')}...`));
    }
    console.log();
  }
};

export type PluginOptions = {
  scoringFn?: ScoringFn,
  faultFilePath?: string | null;
}
export const createPlugin = (
  { scoringFn = dStar, faultFilePath = './faults/faults.json' }: PluginOptions
): PartialTestHookOptions => {
  return {
    on: {
      complete: async (results: TesterResults) => {
        const testResults: TestResult[] = [...results.testResults.values()];
        const fileResults = gatherResults(testResults);
        const totalPassFailStats = passFailStatsFromTests(testResults);
        const faults = localizeFaults(testResults, fileResults, (expressionPassFailStats) => scoringFn(expressionPassFailStats, totalPassFailStats));      
        await reportFaults(faults, scoringFn);
        if (faultFilePath !== null) {
          await recordFaults(faultFilePath, faults);
        }
      }
    }
  };
};

export default createPlugin;
