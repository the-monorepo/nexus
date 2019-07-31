import 'source-map-support/register';
import { consoleTransport, logger } from '@pshaw/logger';

import { writeFile } from 'mz/fs';
import * as flRunner from '@fault/runner';
import { resolve, normalize } from 'path';
import globby from 'globby';
import * as micromatch from 'micromatch';
import chalk from 'chalk';

import { readCoverageFile, getTotalExecutedStatements } from '@fault/istanbul-util';
import { ScorelessFault, createPlugin } from '@fault/addon-sbfl';
import { convertFileFaultDataToFaults } from '@fault/record-faults';
import { dStar } from '@fault/sbfl-dstar';
import { tarantula } from '@fault/sbfl-tarantula';
import { ochiai } from '@fault/sbfl-ochiai';
import { barinel } from '@fault/sbfl-barinel';
import { op2 } from '@fault/sbfl-op2';

import { BenchmarkConfig, ProjectConfig } from './config';
import benchmarkConfig from './config';


export const faultToKey = (projectDir: string, fault: ScorelessFault): string => {
  return `${normalize(resolve(projectDir, fault.sourcePath)).replace(/\\+/g, '\\')}:${fault.location.start.line}:${
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

const log = logger().add(
  consoleTransport({
    level: 'verbose',
  }),
);

const faultFilePath = (projectDir: string, sbflModuleFolderName: string) => {
  const faultPath = resolve(projectDir, 'faults', sbflModuleFolderName, 'faults.json');
  return faultPath;
};

const findConfig = (benchmarkConfig: BenchmarkConfig, path: string): ProjectConfig | null => {
  for(const projectConfig of benchmarkConfig) {
    const globs = Array.isArray(projectConfig.glob) ? projectConfig.glob : [projectConfig.glob];
    const resolvedGlobs = globs.map(glob => resolve('./projects', glob).replace(/\\+/g, '/'));
    if (micromatch.isMatch(path, resolvedGlobs)) {
      return projectConfig;
    }
  }
  return null;
}

export const run = async () => {
  const projectDirs = await getProjectPaths(
    process.argv.length <= 2 ? undefined : process.argv.slice(2),
  );

  const runOnProject = async (projectDir: string) => {
    log.verbose(`Starting ${projectDir}...`);
    
    const selectedConfig = findConfig(benchmarkConfig, projectDir);
    if (selectedConfig === null) {
      log.warn(`Could not find an explicit config for '${chalk.cyan(projectDir)}'`);
    }
    const projectConfig = selectedConfig === null ? {} : selectedConfig; 
    const {
      setupFiles = [resolve(__dirname, 'babel')],
      sandbox = false,
      tester = '@fault/tester-mocha',
    } = projectConfig;

    const optionsEnv = projectConfig.env ? projectConfig.env : {};

    const testMatch = (() => {
      if (projectConfig.testMatch) {
        if (typeof projectConfig.testMatch === 'string') {
          return resolve(projectDir, projectConfig.testMatch);
        } else {
          return projectConfig.testMatch.map(glob => resolve(projectDir, glob));
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

    // TODO: Don't hard code testerOptions
    await flRunner.run({
      tester,
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
    await writeFile(faultResultsPath, JSON.stringify(projectOutput, undefined, 2));
  };

  for (const projectDir of projectDirs) {
    await runOnProject(resolve(__dirname, '..', projectDir));
  }
};
run().catch(console.error);
