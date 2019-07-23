import 'source-map-support/register';
import { ScorelessFault, createPlugin } from '@fault/addon-sbfl';
import { convertFileFaultDataToFaults } from '@fault/record-faults';
import { consoleTransport, logger } from '@pshaw/logger';

import { writeFile } from 'mz/fs';
import { existsSync } from 'fs';
import { readCoverageFile, getTotalExecutedStatements } from '@fault/istanbul-util';
import * as flRunner from '@fault/runner';
import { resolve } from 'path';
import globby from 'globby';

export const faultToKey = (projectDir: string, fault: ScorelessFault): string => {
  return `${resolve(projectDir, fault.sourcePath)}:${fault.location.start.line}:${fault.location.start.column}`;
};

export const calculateExamScore = (
  projectDir: string, 
  actualFaults: ScorelessFault[],
  expectedFaults: ScorelessFault[],
  totalExecutableStatements: number,
) => {
  const expectedFaultMap: Map<string, ScorelessFault> = new Map();
  for (const fault of expectedFaults) {
    expectedFaultMap.set(faultToKey(projectDir, fault), fault);
  }

  let sum = 0;
  let linesInspected = 1; // The first fault will still need to be counted as 1 line so start with 1

  for (const actualFault of actualFaults) {
    const key = faultToKey(projectDir, actualFault);
    const expectedFault = expectedFaultMap.get(key);
    if (expectedFault !== undefined) {
      sum += linesInspected;
      expectedFaultMap.delete(key);
    } else {
      linesInspected++;
    }
  }

  return sum / expectedFaults.length / totalExecutableStatements;
};

export type BenchmarkData = {
  [algorithmName: string]: number;
};

export const getProjectPaths = async (path: string | string[] = './projects/*') => {
  return await globby(path, { onlyDirectories: true, expandDirectories: false });
};

const sbflAlgorithmModuleNames = [
  '@fault/sbfl-dstar',
  '@fault/sbfl-ochiai',
  '@fault/sbfl-tarantula',
];

type BenchmarkConfig = {
  // Setup files to use (E.g. Babel register to transpile files)
  setupFiles: string[];
  // Name of the project
  name: string;
  testMatch: string;
};

const log = logger().add(
  consoleTransport({
    level: 'verbose',
  }),
);

export const run = async () => {
  const projectDirs = await getProjectPaths(process.argv.length <= 2 ? undefined : process.argv.slice(2));

  const runOnProject = async (projectDir: string) => {
    log.verbose(`Starting ${projectDir}...`);
    const benchmarkConfigPath = resolve(projectDir, 'benchmark.config.js');
    const benchmarkConfigExists = existsSync(benchmarkConfigPath);
    const {
      setupFiles = [resolve(__dirname, 'babel')],
      testMatch = resolve(projectDir, '**/*.test.{js,jsx,ts,tsx}'),
    }: BenchmarkConfig = benchmarkConfigExists ? require(benchmarkConfigPath) : {};
    const expectedFaults = convertFileFaultDataToFaults(
      require(resolve(projectDir, 'expected-faults.json')),
    );
  
    const projectOutput = {};
  
    for (const sbflModuleName of sbflAlgorithmModuleNames) {
      log.verbose(`Running ${sbflModuleName} on ${projectDir}`);
      const sbflModuleFolderName = sbflModuleName.replace(/@/g, '').replace(/\/|\\/g, '-');
  
      const sbflFaultFilePath = resolve(
        projectDir,
        'faults',
        sbflModuleFolderName,
        'faults.json',
      );
  
      const sbflAddon = createPlugin({
        scoringFn: require(sbflModuleName).default,
        faultFilePath: sbflFaultFilePath,
      });
  
      await flRunner.run({
        tester: '@fault/tester-mocha',
        testMatch: testMatch,
        addons: [sbflAddon],
        setupFiles,
        cwd: projectDir,
      });
  
      const actualFaults = convertFileFaultDataToFaults(require(sbflFaultFilePath));
      const coverage = await readCoverageFile(
        resolve(projectDir, 'coverage/coverage-final.json'),
      );
  
      const totalExecutableStatements = getTotalExecutedStatements(coverage);
  
      const examScore = calculateExamScore(
        projectDir, 
        actualFaults,
        expectedFaults,
        totalExecutableStatements,
      );
  
      projectOutput[sbflModuleName] = examScore;
    }
    const faultResultsPath = resolve(projectDir, 'fault-results.json');
  
    console.log(projectOutput);
    await writeFile(faultResultsPath, JSON.stringify(projectOutput, undefined, 2));
  };

  for (const projectDir of projectDirs) {
    await runOnProject(resolve(__dirname, '..', projectDir));
  }
};
run().catch(console.error);
