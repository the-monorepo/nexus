import 'source-map-support/register';
import { consoleTransport, logger } from '@pshaw/logger';

import { writeFile } from 'mz/fs';
import { existsSync } from 'fs';
import * as flRunner from '@fault/runner';
import { resolve, normalize } from 'path';
import globby from 'globby';

import { readCoverageFile, getTotalExecutedStatements } from '@fault/istanbul-util';
import { ScorelessFault, createPlugin } from '@fault/addon-sbfl';
import { convertFileFaultDataToFaults } from '@fault/record-faults';
import { dStar } from '@fault/sbfl-dstar';
import { tarantula } from '@fault/sbfl-tarantula';
import { ochiai } from '@fault/sbfl-ochiai';
import { barinel } from '@fault/sbfl-barinel';
import { op2 } from '@fault/sbfl-op2';

export const faultToKey = (projectDir: string, fault: ScorelessFault): string => {
  return `${normalize(resolve(projectDir, fault.sourcePath)).replace(/\\\\/g, '\\')}:${fault.location.start.line}:${
    fault.location.start.column
  }`;
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
  let nonFaultElementsInspected = 0; // The first fault will still need to be counted as 1 line so start with 1

  for (const actualFault of actualFaults) {
    const key = faultToKey(projectDir, actualFault);
    const expectedFault = expectedFaultMap.get(key);
    if (expectedFault !== undefined) {
      sum += nonFaultElementsInspected;
      expectedFaultMap.delete(key);
    } else {
      nonFaultElementsInspected++;
    }
  }
  sum += expectedFaultMap.size * nonFaultElementsInspected;

  return (sum / expectedFaults.length) / totalExecutableStatements;
};

export type BenchmarkData = {
  [algorithmName: string]: number;
};

export const getProjectPaths = async (path: string | string[] = '*') => {
  const projectsDir = './projects';
  const resolved = typeof path === 'string' ? resolve(projectsDir, path) : path.map(glob => resolve(projectsDir, glob));
  return await globby(resolved, { onlyDirectories: true, expandDirectories: false });
};

const sbflAlgorithms = [
  { name: 'dstar-0', scoringFn: (a, b) => dStar(a, b, 0) },
  { name: 'dstar-1', scoringFn: (a, b) => dStar(a, b, 1) },
  { name: 'dstar-2', scoringFn: dStar, console: true },
  { name: 'dstar-3', scoringFn: (a, b) => dStar(a, b, 3) },
  { name: 'dstar-4', scoringFn: (a, b) => dStar(a, b, 4) },
  { name: 'dstar-5', scoringFn: (a, b) => dStar(a, b, 5) },
  { name: 'ochiai', scoringFn: ochiai },
  { name: 'tarantula', scoringFn: tarantula },
  { name: 'barinel', scoringFn: barinel },
  { name: 'op2', scoringFn: op2 },
];

type BenchmarkConfig = {
  // Setup files to use (E.g. Babel register to transpile files)
  setupFiles?: string[];
  // Name of the project
  testMatch?: string | string[];
  env: { [s: string]: any },
  sandbox?: boolean;
};

const log = logger().add(
  consoleTransport({
    level: 'verbose',
  }),
);

const faultFilePath = (projectDir: string, sbflModuleFolderName: string) => {
  const faultPath = resolve(projectDir, 'faults', sbflModuleFolderName, 'faults.json');
  return faultPath;
};

export const run = async () => {
  const projectDirs = await getProjectPaths(
    process.argv.length <= 2 ? undefined : process.argv.slice(2),
  );

  const runOnProject = async (projectDir: string) => {
    log.verbose(`Starting ${projectDir}...`);

    const benchmarkConfigPath = resolve(projectDir, 'benchmark.config.js');
    const benchmarkConfigExists = existsSync(benchmarkConfigPath);

    const benchmarkConfig: BenchmarkConfig = benchmarkConfigExists ? require(benchmarkConfigPath) : {};
    const {
      setupFiles = [resolve(__dirname, 'babel')],
      sandbox = false
    } = benchmarkConfig;

    const optionsEnv = benchmarkConfig.env ? benchmarkConfig.env : {};

    const testMatch = (() => {
      if (benchmarkConfig.testMatch) {
        if (typeof benchmarkConfig.testMatch === 'string') {
          return resolve(projectDir, benchmarkConfig.testMatch);
        } else {
          return benchmarkConfig.testMatch.map(glob => resolve(projectDir, glob));
        }
      } else {
        return resolve(projectDir, '**/*.test.{js,jsx,ts,tsx}');
      }
    })();

    const expectedFaults = convertFileFaultDataToFaults(
      require(resolve(projectDir, 'expected-faults.json')),
    );

    const projectOutput = {};

    log.verbose(`Running SBFL algorithms on ${projectDir}`);

    const sbflAddons = sbflAlgorithms.map(({ scoringFn, name, console = false }) => {
      const sbflAddon = createPlugin({
        scoringFn: scoringFn,
        faultFilePath: faultFilePath(projectDir, name),
        console
      });

      return sbflAddon;
    });

    await flRunner.run({
      tester: '@fault/tester-mocha',
      testMatch,
      addons: sbflAddons,
      cwd: projectDir,
      setupFiles,
      testerOptions: {
        resetRequireCache: false,
        sandbox
      },
      env: {
        ...process.env,
        ...optionsEnv
      },
      workers: sandbox ? undefined : 1
    });

    const coverage = await readCoverageFile(
      resolve(projectDir, 'coverage/coverage-final.json'),
    );

    for (const { name } of sbflAlgorithms) {
      const actualFaults = convertFileFaultDataToFaults(
        require(faultFilePath(projectDir, name)),
      );

      const totalExecutableStatements = getTotalExecutedStatements(coverage);

      const examScore = calculateExamScore(
        projectDir,
        actualFaults,
        expectedFaults,
        totalExecutableStatements,
      );

      projectOutput[name] = examScore;
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
