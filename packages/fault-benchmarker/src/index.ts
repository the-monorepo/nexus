import 'source-map-support/register';
import { consoleTransport, logger } from '@pshaw/logger';

import { writeFile } from 'mz/fs';
import * as flRunner from '@fault/runner';
import { resolve, normalize } from 'path';
import globby from 'globby';
import * as micromatch from 'micromatch';
import chalk from 'chalk';

import {
  readCoverageFile,
  getTotalExecutedStatements,
  ExpressionLocation,
} from '@fault/istanbul-util';
import { ScorelessFault, createPlugin } from '@fault/addon-sbfl';
import { convertFileFaultDataToFaults } from '@fault/record-faults';
import { dStar } from '@fault/sbfl-dstar';
import { tarantula } from '@fault/sbfl-tarantula';
import { ochiai } from '@fault/sbfl-ochiai';
import { barinel } from '@fault/sbfl-barinel';
import { op2 } from '@fault/sbfl-op2';

import { BenchmarkConfig, ProjectConfig } from './config';
import benchmarkConfig from './config';

const WITHIN = 'within';
const EXACT = 'exact';

export type WithinFault = {
  type: typeof WITHIN;
} & ScorelessFault;

export type ExactFault = {
  type: typeof EXACT | undefined;
} & ScorelessFault;

export type ExpectedFault = WithinFault & ExactFault;

export const normalizeKeyPath = (projectDir: string, sourcePath: string) => {
  return normalize(resolve(projectDir, sourcePath)).replace(/\\+/g, '\\');
};

export const mostSpecificFaultKey = (
  projectDir: string,
  fault: ScorelessFault,
): string => {
  let lastKey: string = undefined as any;
  for (const key of faultKeys(projectDir, fault)) {
    lastKey = key;
  }
  return lastKey;
};

export function* faultKeys(
  projectDir: string,
  fault: ScorelessFault,
): IterableIterator<string> {
  const justFile = `${normalizeKeyPath(projectDir, fault.sourcePath)}`;
  yield justFile;
  if (fault.location !== undefined) {
    const withStart = `${justFile}:${fault.location.start.line}:${fault.location.start.column}`;
    yield withStart;
    if (fault.location.end !== undefined) {
      const withEnd = `${withStart}:${fault.location.end.line}:${fault.location.end.column}`;
      yield withEnd;
    }
  }
}

export const isWithinLocation = (
  projectDir: string,
  withinLocation: WithinFault,
  fault: ScorelessFault,
): boolean => {
  const sameFile =
    normalizeKeyPath(projectDir, withinLocation.sourcePath) ===
    normalizeKeyPath(projectDir, fault.sourcePath);
  if (!sameFile) {
    return false;
  }
  if (withinLocation.location === undefined) {
    return true;
  }
  const withinStart =
    sameFile &&
    (fault.location.start.line > withinLocation.location.start.line ||
      (fault.location.start.line === withinLocation.location.start.line &&
        fault.location.start.column >= withinLocation.location.start.column));
  if (!withinStart) {
    return false;
  }
  if (withinLocation.location.end == undefined) {
    return true;
  }
  const withinEnd =
    withinStart &&
    (fault.location.start.line < withinLocation.location.end.line ||
      (fault.location.start.line === withinLocation.location.end.line &&
        fault.location.start.column <= withinLocation.location.end.column));
  return withinEnd;
};

export const calculateExamScore = (
  projectDir: string,
  actualFaults: ScorelessFault[],
  expectedFaults: ExpectedFault[],
  totalExecutableStatements: number,
) => {
  const expectedExactLocations: Set<string> = new Set(
    expectedFaults
      .filter(
        expectedFault => expectedFault.type === EXACT || expectedFault.type === undefined,
      )
      .map(expectedFault => mostSpecificFaultKey(projectDir, expectedFault)),
  );
  const withinLocations: WithinFault[] = expectedFaults.filter(
    expectedFault => expectedFault.type === WITHIN,
  ) as WithinFault[];
  let sum = 0;
  let nonFaultElementsInspected = 0; // The first fault will still need to be counted as 1 line so start with 1

  for (const actualFault of actualFaults) {
    let removedSomething = false;

    for (let w = 0; w < withinLocations.length; w++) {
      if (isWithinLocation(projectDir, withinLocations[w], actualFault)) {
        removedSomething = true;
        sum += nonFaultElementsInspected;
        withinLocations.splice(w, 1);
      }
    }

    for (const key of faultKeys(projectDir, actualFault)) {
      if (expectedExactLocations.has(key)) {
        sum += nonFaultElementsInspected;
        expectedExactLocations.delete(key);
        removedSomething = true;
      }
    }

    if (!removedSomething) {
      nonFaultElementsInspected++;
    }
  }
  sum += expectedExactLocations.size * nonFaultElementsInspected;
  sum += withinLocations.length * nonFaultElementsInspected;

  return sum / expectedFaults.length / totalExecutableStatements;
};

export type BenchmarkData = {
  [algorithmName: string]: number;
};

export const getProjectPaths = async (path: string | string[] = '*') => {
  const projectsDir = './projects';
  const resolved =
    typeof path === 'string'
      ? resolve(projectsDir, path)
      : path.map(glob => resolve(projectsDir, glob));
  return await globby(resolved, { onlyDirectories: true, expandDirectories: false });
};

const sbflAlgorithms = [
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

const findConfig = (
  benchmarkConfig: BenchmarkConfig,
  path: string,
): ProjectConfig | null => {
  for (const projectConfig of benchmarkConfig) {
    const globs = Array.isArray(projectConfig.glob)
      ? projectConfig.glob
      : [projectConfig.glob];

    const resolvedGlobs = globs.map(glob =>
      resolve('./projects', glob).replace(/\\+/g, '/'),
    );

    if (micromatch.isMatch(path, resolvedGlobs)) {
      return projectConfig;
    }
  }
  return null;
};

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
      tester = '@fault/tester-mocha',
      testOptions,
    } = projectConfig;
    const { sandbox = false, mocha = require.resolve('mocha') } =
      testOptions === undefined ? {} : testOptions;
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
        ignoreGlob: '../fault-*/**/*',
        console,
      });

      return sbflAddon;
    });
    // TODO: Don't hard code testerOptions
    const commonRunnerOptions = {
      tester,
      testMatch,
      cwd: projectDir,
      setupFiles,
      testerOptions: {
        timeout: 15000,
        ...testOptions,
        sandbox,
        mocha,
      },
      env: {
        ...process.env,
        ...optionsEnv,
      },
      workers: sandbox ? undefined : 1,
      fileBufferCount: sandbox ? undefined : null,
    };
    // SBFL
    await flRunner.run({
      ...commonRunnerOptions,
      addons: sbflAddons,
    });
    // MBFL
    const mbflName = 'mbfl';
    await flRunner.run({
      ...commonRunnerOptions,
      addons: [require('@fault/addon-mutation-localization').default({
        faultFilePath: faultFilePath(projectDir, mbflName),
        ignoreGlob: '../fault-*/**/*',
        mapToIstanbul: true,
        console: true,
      })]
    });

    const coverage = await readCoverageFile(
      resolve(projectDir, 'coverage/coverage-final.json'),
    );

    for (const { name } of (sbflAlgorithms as any).concat([{ name: mbflName }])) {
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

    console.log(projectOutput);

    const faultResultsPath = resolve(projectDir, 'fault-results.json');
    await writeFile(faultResultsPath, JSON.stringify(projectOutput, undefined, 2));
  };

  for (const projectDir of projectDirs) {
    await runOnProject(resolve(__dirname, '..', projectDir));
  }
};
run().catch(console.error);
