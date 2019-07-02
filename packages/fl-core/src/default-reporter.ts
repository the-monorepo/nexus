import { relative, dirname, basename, join } from 'path';
import { TestResult } from 'fl-addon-core';
import chalk from 'chalk';

export const reporter = ({ testResults }: { testResults: TestResult[] }) => {
  testResults.sort((a, b) => a.file.localeCompare(b.file));
  for(const testResult of testResults) {
    const filePath = relative(process.cwd(), testResult.file);
    const fileName = basename(filePath);
    const fileDir = dirname(filePath);
    const formattedFilePath = join(fileDir, chalk.bold(fileName));
    if (testResult.passed) {
      console.log(`${chalk.bgGreenBright(chalk.black(' PASS '))} ${formattedFilePath}`);
    } else {
      console.log(`${chalk.bgRedBright(chalk.black(' FAIL '))} ${formattedFilePath}`);
      console.log(testResult.stack);
    }
  }
  const passedCount = testResults.filter((result) => result.passed).length;
  const failedCount = testResults.length - passedCount;
  const totalCount = testResults.length;
  console.log(`${chalk.bold('Tests:')} ${failedCount > 0 ? `${chalk.redBright(`${failedCount} failed`)}, ` : ''}${chalk.greenBright(`${passedCount} passed`)}, ${totalCount} total`);
}
export default reporter;