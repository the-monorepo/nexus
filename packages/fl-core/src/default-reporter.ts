import { relative, dirname, basename, join } from 'path';
import { TestResult } from 'fl-addon-core';
import chalk from 'chalk';
import { report } from 'fl-istanbul-reporter';
import { readFile } from 'mz/fs';
import { groupTestsByFilePath, localiseFaults, gatherResults, Stats, passFailStatsFromTests, FileResult } from './fl';
const dStar = (codeElementTestStateCounts: Stats, totalTestStateCounts: Stats, e = 2) => {
  if (codeElementTestStateCounts.failed === 0) {
    return null;
  }
  return (
    Math.pow(codeElementTestStateCounts.failed, e) /
    (codeElementTestStateCounts.passed +
      (totalTestStateCounts.failed - codeElementTestStateCounts.failed))
  );
};

const reportPassFailCounts = (prefix, failedCount, passedCount, totalCount) => {
  console.log(
    `${chalk.bold(`${prefix}`)}${chalk.redBright(
      `${failedCount} failed`,
    )}, ${chalk.greenBright(`${passedCount} passed`)}, ${totalCount} total`,
  );
};

const reportFaults = async (testResults: TestResult[], fileResults: Map<string, FileResult>, totalPassFailStats: Stats) => {
  const faults = localiseFaults(testResults, fileResults, (expressionPassFailStats) => dStar(expressionPassFailStats, totalPassFailStats));
  const rankedFaults = faults.filter(fault => fault.score !== null).sort((f1, f2) => f2.score! - f1.score!).slice(0, 10);
  for(const fault of rankedFaults) {
    const lines = (await readFile(fault.sourcePath, 'utf8')).split('\n');
    console.log(
      `${fault.sourcePath}:${fault.location.start.line}:${fault.location.start.column}, ${chalk.cyan(fault.score!.toString())}`,
    );
    let l = fault.location.start.line - 1;
    let lineCount = 0;
    while (l < fault.location.end.line && lineCount < 3) {
      console.log(chalk.grey(lines[l++]));
      lineCount++;
    }
    if (l < fault.location.end.line) {
      console.log('...');
    }
    console.log();
  }

}

export const reporter = async ({
  testResults,
  duration
}: {
  testResults: TestResult[];
}) => {
  const suiteResults = groupTestsByFilePath(testResults);
  testResults.sort((a, b) => a.file.localeCompare(b.file));

  const fileResults = gatherResults(testResults);
  const totalPassFailStats: Stats = passFailStatsFromTests(testResults);

  for (const testResult of testResults) {
    if (testResult.passed) {
      continue;
    }
    console.log(chalk.bold(testResult.fullTitle));
    console.log(chalk.red(testResult.stack));
  }

  await reportFaults(testResults, fileResults, totalPassFailStats);

  report({ testResults, suiteResults });
  for (const [absoluteFilePath, suiteResult] of suiteResults.entries()) {
    const filePath = relative(process.cwd(), absoluteFilePath);

    const fileName = basename(filePath);
    const fileDir = dirname(filePath);
    const formattedFilePath = join(fileDir, chalk.bold(fileName));
    const passed = !suiteResult.some(result => !result.passed);
    if (passed) {
      console.log(`${chalk.bgGreenBright(chalk.black(' PASS '))} ${formattedFilePath}`);
    } else {
      console.log(`${chalk.bgRedBright(chalk.black(' FAIL '))} ${formattedFilePath}`);
    }
  }

  console.log();

  const suiteCount = suiteResults.size;
  const suitePassedCount = Array.from(suiteResults.entries()).filter(
    ([filePath, results]) => !results.some(result => !result.passed),
  ).length;
  const suiteFailedCount = suiteCount - suitePassedCount;
  reportPassFailCounts('Test Suite: ', suiteFailedCount, suitePassedCount, suiteCount);

  const passedCount = testResults.filter(result => result.passed).length;
  const totalCount = testResults.length;
  const failedCount = totalCount - passedCount;
  reportPassFailCounts('Tests:      ', failedCount, passedCount, totalCount);
  console.log(chalk.bold('Time:       ') + chalk.yellowBright(`${(Math.round(duration) / 1000).toString()}s`));
  //console.log(faults);
};
export default reporter;
