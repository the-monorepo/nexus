import { TestResult, TesterResults } from '@fault/types';
import { ExpressionLocation } from '@fault/istanbul-util';
import { PartialTestHookOptions } from '@fault/addon-hook-schema';
import { passFailStatsFromTests } from '@fault/localization-util';
import { recordFaults, sortBySuspciousness } from '@fault/record-faults';
import dStar from '@fault/sbfl-dstar';

import { relative } from 'path';
import { readFile } from 'mz/fs';
import chalk from 'chalk';

export type Stats = {
  passed: number;
  failed: number;
};

export type ExpressionResult = {
  stats: Stats;
  location: ExpressionLocation;
  sourcePath: string;
};

export type FileResult = {
  sourcePath: string;
  expressions: ExpressionResult[];
};

export type ScorelessFault = {
  location: ExpressionLocation;
  sourcePath: string;
};

export type Fault = {
  score: number | null;
} & ScorelessFault;

const statementStr = (filePath: string, { start, end }: ExpressionLocation) => {
  return `${filePath}:${start.line}:${start.column}|${end.line}:${end.column}`;
};

/**
 * Gets the pass/fail results for each expression in each file
 */
export const gatherFileResults = (testResults: Iterable<TestResult>): Map<string, FileResult> => {
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
        if (executionCount <= 0) {
          continue;
        }
        const statementCoverage = statementMap[statementKey];

        const hash = statementStr(filePath, statementCoverage);

        const results = (() => {
          if (expressionResults.has(hash)) {
            return expressionResults.get(hash)!;
          } else {
            const passFailCounts: Stats = { passed: 0, failed: 0 };
            const newResult: ExpressionResult = {
              location: statementCoverage,
              stats: passFailCounts,
              sourcePath: fileCoverage.path,
            };
            expressionResults.set(hash, newResult);
            return newResult;
          }
        })();

        if (testResult.passed) {
          results.stats.passed++;
        } else {
          results.stats.failed++;
        }
      }
    }
  }

  const fileResults: Map<string, FileResult> = new Map();
  for (const expressionResult of expressionResults.values()) {
    const { sourcePath } = expressionResult;
    if (!fileResults.has(expressionResult.sourcePath)) {
      fileResults.set(sourcePath, {
        sourcePath,
        expressions: [expressionResult],
      });
    } else {
      const fileResult = fileResults.get(sourcePath)!;
      fileResult.expressions.push(expressionResult);
    }
  }
  return fileResults;
};

type InternalScoringFn = (expressionPassFailStats: Stats) => number | null;
type ExternalScoringFn = (
  expressionPassFailStats: Stats,
  totalPassFailStats: Stats,
) => number | null;
export type ScoringFn = ExternalScoringFn;
export const localizeFaults = (
  groupedTestResults: Iterable<TestResult>,
  fileResults: Map<string, FileResult>,
  scoringFn: InternalScoringFn,
): Fault[] => {
  const faults: Fault[] = [];
  
  // Gather all files that were executed in tests
  const selectedSourceFiles: Set<string> = new Set();
  for (const testResult of groupedTestResults) {
    if (testResult.coverage === undefined) {
      continue;
    }
    for (const fileCoverage of Object.values(testResult.coverage)) {
      selectedSourceFiles.add(fileCoverage.path);
    }
  }

  // For each expression in each executed file, assign a "suspciousness" score
  for (const sourcePath of selectedSourceFiles) {
    const fileResult = fileResults.get(sourcePath)!;
    for (const expression of fileResult.expressions) {
      const { location, sourcePath } = expression;
      faults.push({
        sourcePath,
        location,
        score: scoringFn(expression.stats),
      });
    }
  }
  return faults;
};

const simplifyPath = absoluteFilePath => relative(process.cwd(), absoluteFilePath);

const reportFaults = async (faults: Fault[]) => {
  const rankedFaults = sortBySuspciousness(faults
    .filter(fault => fault.score !== null && fault.score !== Number.NEGATIVE_INFINITY && fault.score !== Number.NaN)
    .sort((f1, f2) => f2.score! - f1.score!))
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
  scoringFn?: ScoringFn;
  faultFilePath?: string | null | true | false;
  console?: boolean,
};

export const createPlugin = ({
  scoringFn = dStar,
  faultFilePath,
  console: printToConsole = false
}: PluginOptions): PartialTestHookOptions => {
  return {
    on: {
      complete: async (results: TesterResults) => {
        const testResults: TestResult[] = [...results.testResults.values()];
        const fileResults = gatherFileResults(testResults);
        const totalPassFailStats = passFailStatsFromTests(testResults);
        const faults = localizeFaults(testResults, fileResults, expressionPassFailStats =>
          scoringFn(expressionPassFailStats, totalPassFailStats),
        );
        if (printToConsole) {
          await reportFaults(faults);
        }
        if (
          faultFilePath !== null &&
          faultFilePath !== undefined &&
          faultFilePath !== false
        ) {
          const resolvedFilePath = (() => {
            if (faultFilePath === true) {
              return './faults/faults.json';
            } else {
              return faultFilePath;
            }
          })();
          await recordFaults(resolvedFilePath, faults);
        }
      },
    },
  };
};

export default createPlugin;
