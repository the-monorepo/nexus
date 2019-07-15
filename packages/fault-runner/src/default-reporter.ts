import { relative, dirname, basename, join } from 'path';
import chalk from 'chalk';
import { report } from '@fault/istanbul-reporter';
import { PartialTestHookOptions } from '@fault/addon-hook-schema';
import { TestResult, TesterResults } from '@fault/types';

const simplifyPath = absoluteFilePath => relative(process.cwd(), absoluteFilePath);

const reportPassFailCounts = (prefix, failedCount, passedCount, totalCount) => {
  console.log(
    `${chalk.bold(`${prefix}`)}${chalk.redBright(
      `${failedCount} failed`,
    )}, ${chalk.greenBright(`${passedCount} passed`)}, ${totalCount} total`,
  );
};

const titleFromPath = (path: string[]) => {
  return path.join(chalk.dim(' \u203A '));
};

export const groupTestsByFilePath = (testResults: Iterable<TestResult>) => {
  const grouped: Map<string, TestResult[]> = new Map();
  for (const testResult of testResults) {
    if (!grouped.has(testResult.file)) {
      grouped.set(testResult.file, [testResult]);
    } else {
      const groupedTestResults = grouped.get(testResult.file)!;
      groupedTestResults.push(testResult);
    }
  }
  return grouped;
};

const onComplete = async ({ testResults, duration }: TesterResults) => {
  const testResultsArr: TestResult[] = [...testResults.values()];
  const suiteResults = groupTestsByFilePath(testResultsArr);
  testResultsArr.sort((a, b) => a.file.localeCompare(b.file));

  for (const testResult of testResultsArr) {
    if (testResult.passed) {
      continue;
    }
    console.log(chalk.bold(titleFromPath(testResult.titlePath)));
    console.log(chalk.red(testResult.stack));
  }

  for (const [absoluteFilePath, suiteResult] of suiteResults.entries()) {
    const filePath = simplifyPath(absoluteFilePath);

    const fileName = basename(filePath);
    const fileDir = dirname(filePath);
    const formattedFilePath = join(fileDir, chalk.bold(fileName));
    const passed = !suiteResult.some(result => !result.passed);
    if (passed) {
      console.log(`${chalk.reset.inverse.bold.green(' PASS ')} ${formattedFilePath}`);
    } else {
      console.log(`${chalk.reset.inverse.bold.red(' FAIL ')} ${formattedFilePath}`);
    }
  }

  report({ testResults });

  console.log();
  const suiteCount = suiteResults.size;
  const suitePassedCount = Array.from(suiteResults.entries()).filter(
    ([filePath, results]) => !results.some(result => !result.passed),
  ).length;
  const suiteFailedCount = suiteCount - suitePassedCount;
  reportPassFailCounts('Files:  ', suiteFailedCount, suitePassedCount, suiteCount);

  const passedCount = testResultsArr.filter(result => result.passed).length;
  const totalCount = testResultsArr.length;
  const failedCount = totalCount - passedCount;
  reportPassFailCounts('Tests:  ', failedCount, passedCount, totalCount);
  console.log(
    chalk.bold('Time:   ') +
      chalk.yellowBright(`${(Math.round(duration) / 1000).toString()}s`),
  );
  //console.log(faults);
};

const hooks: PartialTestHookOptions = {
  on: {
    complete: onComplete,
  },
};

export default hooks;
