import 'source-map-support/register';
import { ScorelessFault, createPlugin } from '@fault/addon-sbfl';
import { convertFileFaultDataToFaults } from '@fault/record-faults';
import { writeFile } from 'mz/fs';
import { existsSync, exists } from 'fs';
import { readCoverageFile, getTotalExecutedStatements } from '@fault/istanbul-util';
import * as flRunner from '@fault/runner';
import { basename, join } from 'path';
import globby from 'globby';

export const faultToKey = (fault: ScorelessFault): string => {
  return `${fault.sourcePath}:${fault.location.start.line}:${fault.location.start.column}`;
}

export const calculateExamScore = (actualFaults: ScorelessFault[], expectedFaults: ScorelessFault[], totalExecutableStatements: number) => {
  const expectedFaultMap: Map<string, ScorelessFault> = new Map();
  for(const fault of expectedFaults) {
    expectedFaultMap.set(faultToKey(fault), fault);
  }

  let sum = 0;
  let linesInspected = 1; // The first fault will still need to be counted as 1 line so start with 1

  for(const actualFault of actualFaults) {
    const key = faultToKey(actualFault);
    const expectedFault = expectedFaultMap.get(key);
    if (expectedFault !== undefined) {
      sum += linesInspected;
      expectedFaultMap.delete(key);
    } else {
      linesInspected++;
    }
  }

  return (sum / expectedFaults.length) / totalExecutableStatements;
}

export type BenchmarkData = {
  [algorithmName: string]: number;
}

export const getProjectPaths = async () => {
  return await globby('./projects', { onlyDirectories: true });
}

const sbflAlgorithmModuleNames = [
  '@fault/sbfl-dstar', '@fault/sbfl-ochiai', '@fault/sbfl-tarantula'
];

type BenchmarkConfig = {
  // Setup files to use (E.g. Babel register to transpile files)
  setupFiles: string[];
  // Name of the project
  name: string;
  testMatch: string
};

export const runOnProject = async (projectDir: string) => {
  const benchmarkConfigPath = join(projectDir, 'benchmark.config.js');
  const benchmarkConfigExists = existsSync(benchmarkConfigPath);
  const { setupFiles = [], testMatch = join(projectDir, '**/*.test.js') }: BenchmarkConfig = benchmarkConfigExists ? require(benchmarkConfigPath) : {};
  const expectedFaults = convertFileFaultDataToFaults(require(join(projectDir, 'expected-faults.json')));

  const projectOutput = {};

  for(const sbflModuleName of sbflAlgorithmModuleNames) {
    const sbflModuleFolderName = sbflModuleName.replace(/@/g, '').replace(/\/|\\/g, '-')

    const sbflFaultFilePath = join(projectDir, 'faults', sbflModuleFolderName, 'faults.json');

    const sbflAddon = createPlugin({
      scoringFn: require(sbflModuleName).default,
      faultFilePath: sbflFaultFilePath
    });

    await flRunner.run({
      tester: '@fault/tester-mocha',
      testMatch: testMatch,
      addons: [
        sbflAddon
      ],
      setupFiles,
      cwd: projectDir
    });

    const actualFaults = convertFileFaultDataToFaults(require(sbflFaultFilePath));

    const coverage = await readCoverageFile(join(projectDir, 'coverage/coverage-final.json'));

    const totalExecutableStatements = getTotalExecutedStatements(coverage);

    const examScore = calculateExamScore(actualFaults, expectedFaults, totalExecutableStatements);

    projectOutput[sbflModuleName] = examScore;
  }  

  await writeFile(join(projectDir, 'fault-results.json'), JSON.stringify(projectOutput, undefined, 2));
}

export const run = async () => {
  const projectDirs = await getProjectPaths();

  for(const projectDir of projectDirs) {
    await runOnProject(join(__dirname, '..', projectDir));
  }
}
run();