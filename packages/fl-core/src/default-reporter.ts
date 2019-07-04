import { relative, dirname, basename, join } from 'path';
import { TestResult } from 'fl-addon-core';
import chalk from 'chalk';
import { report } from 'fl-istanbul-reporter';
import { readFile } from 'mz/fs';

const reportPassFailCounts = (prefix, failedCount, passedCount, totalCount) => {
  console.log(
    `${chalk.bold(`${prefix}:`)} ${chalk.redBright(
      `${failedCount} failed`,
    )}, ${chalk.greenBright(`${passedCount} passed`)}, ${totalCount} total`,
  );
};

export const reporter = async ({
  testResults,
  suiteResults,
  faults,
}: {
  testResults: TestResult[];
  suiteResults: Map<string, TestResult[]>;
  faults: any;
}) => {
  testResults.sort((a, b) => a.file.localeCompare(b.file));
  for (const testResult of testResults) {
    if (!testResult.passed) {
      console.log(chalk.bold(testResult.fullTitle));
      console.log(chalk.gray(testResult.stack));
    }
  }
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
  const suiteCount = suiteResults.size;
  const suitePassedCount = Array.from(suiteResults.entries()).filter(
    ([filePath, results]) => !results.some(result => !result.passed),
  ).length;
  const suiteFailedCount = suiteCount - suitePassedCount;
  reportPassFailCounts('Test Suite', suiteFailedCount, suitePassedCount, suiteCount);

  const passedCount = testResults.filter(result => result.passed).length;
  const totalCount = testResults.length;
  const failedCount = totalCount - passedCount;
  reportPassFailCounts('Tests', failedCount, passedCount, totalCount);
  //console.log(faults);
  for (const suiteFaults of faults) {
    console.log(chalk.bold('suite'));
    const faultMap = new Map();
    for (const fault of suiteFaults) {
      if (!faultMap.has(fault.sourceFile)) {
        faultMap.set(fault.sourceFile, []);
      }
      const fileFaults = faultMap.get(fault.sourceFile)!;
      fileFaults.push(fault);
    }
    for (const [file, fileFaults] of faultMap.entries()) {
      console.log(chalk.bold(file));
      fileFaults.sort(fault => fault.location.start.column);
      fileFaults.sort(fault => fault.location.line);
      const lines = (await readFile(file, 'utf8')).split('\n');
      for (const fault of fileFaults) {
        //console.log(`fault ${chalk.cyan(fault.rank)}`, fault.location);
        let l = fault.location.start.line - 1;
        let lineCount = 0;
        while (l < fault.location.end.line && lineCount < 5) {
          //console.log(lines[l++]);
          lineCount++;
        }
        if (l < fault.location.end.line) {
          //console.log('...');
        }
      }
    }
  }
};
export default reporter;
