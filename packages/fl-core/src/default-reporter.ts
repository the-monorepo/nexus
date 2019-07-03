import { relative, dirname, basename, join } from 'path';
import { TestResult } from 'fl-addon-core';
import chalk from 'chalk';

const reportPassFailCounts = (prefix, failedCount, passedCount, totalCount) => {
  console.log(`${chalk.bold(`${prefix}:`)} ${failedCount > 0 ? `${chalk.redBright(`${failedCount} failed`)}, ` : ''}${chalk.greenBright(`${passedCount} passed`)}, ${totalCount} total`);
}

export const reporter = ({ testResults, suiteResults }: { testResults: TestResult[], suiteResults: Map<string, TestResult[]> }) => {
  testResults.sort((a, b) => a.file.localeCompare(b.file));
  for(const testResult of testResults) {
    if (!testResult.passed) {
      console.log(chalk.bold(testResult.fullTitle));
      console.log(chalk.gray(testResult.stack));
    }
  }
  for(const [absoluteFilePath, suiteResult] of suiteResults.entries()) {
    const filePath = relative(process.cwd(), absoluteFilePath);

    const fileName = basename(filePath);
    const fileDir = dirname(filePath);
    const formattedFilePath = join(fileDir, chalk.bold(fileName));
    const passed = !suiteResult.some((result) => !result.passed);
    if (passed) {
      console.log(`${chalk.bgGreenBright(chalk.black(' PASS '))} ${formattedFilePath}`);
    } else {
      console.log(`${chalk.bgRedBright(chalk.black(' FAIL '))} ${formattedFilePath}`);
    }
  }
  const suiteCount = suiteResults.size;
  const suitePassedCount = Array.from(suiteResults.entries()).filter(([filePath, results]) => !results.some(result => !result.passed)).length;
  const suiteFailedCount = suiteCount - suitePassedCount;
  reportPassFailCounts('Test Suite', suiteFailedCount, suitePassedCount, suiteCount);

  const passedCount = testResults.filter((result) => result.passed).length;
  const totalCount = testResults.length;
  const failedCount = totalCount - passedCount;
  reportPassFailCounts('Tests', failedCount, passedCount, totalCount);
}
export default reporter;