import 'source-map-support/register.js';

import { resolve, normalize } from 'path';

import chalk from 'chalk';

import * as micromatch from 'micromatch';

import { createPlugin } from '@fault/addon-sbfl';
import { readCoverageFile, getTotalExecutedStatements } from '@fault/istanbul-util';
import { convertFileFaultDataToFaults, ScorelessFault } from '@fault/record-faults';
import * as flRunner from '@fault/runner';
import { barinel } from '@fault/sbfl-barinel';
import { dStar } from '@fault/sbfl-dstar';
import { ochiai } from '@fault/sbfl-ochiai';
import { op2 } from '@fault/sbfl-op2';
import { tarantula } from '@fault/sbfl-tarantula';
import { writeJson, readJson } from '@pshaw/fs';
import createLogger from '@pshaw/logger';

import { BenchmarkConfig, ProjectConfig } from './config.ts';
import benchmarkConfig from './config.ts';
import { requestProjectDirs } from './requestProjectDirs.ts';

const WITHIN = 'within';
const EXACT = 'exact';

export type WithinFault = {
  type: typeof WITHIN;
} & ScorelessFault;

export type ExactFault = {
  type: typeof EXACT | undefined;
} & ScorelessFault;

export type ExpectedFault = WithinFault | ExactFault;

export const normalizeKeyPath = (projectDir: string, sourcePath: string) => {
  return normalize(resolve(projectDir, sourcePath)).replace(/\\+/g, '\\');
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
  if (withinLocation.location.end === undefined) {
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
        (expectedFault) =>
          expectedFault.type === EXACT || expectedFault.type === undefined,
      )
      .map((expectedFault) => mostSpecificFaultKey(projectDir, expectedFault)),
  );

  const withinLocations: WithinFault[] = expectedFaults.filter(
    (expectedFault) => expectedFault.type === WITHIN,
  ) as WithinFault[];
  let sum = 0;
  let nonFaultElementsInspected = 0; // The first fault will still need to be counted as 1 line so start with 1
  // Note: Rank starts from 0
  const rankings: Map<any, number> = new Map();
  for (const actualFault of actualFaults) {
    let removedSomething = false;

    for (let w = withinLocations.length - 1; w >= 0; w--) {
      if (isWithinLocation(projectDir, withinLocations[w], actualFault)) {
        removedSomething = true;
        sum += nonFaultElementsInspected;
        rankings.set(withinLocations[w], nonFaultElementsInspected);
        withinLocations.splice(w, 1);
      }
    }

    for (const key of faultKeys(projectDir, actualFault)) {
      if (expectedExactLocations.has(key)) {
        sum += nonFaultElementsInspected;
        rankings.set(key, nonFaultElementsInspected);
        expectedExactLocations.delete(key);
        removedSomething = true;
      }
    }

    if (!removedSomething) {
      nonFaultElementsInspected++;
    }
  }
  sum += expectedExactLocations.size * totalExecutableStatements;
  sum += withinLocations.length * totalExecutableStatements;

  return {
    exam: sum / expectedFaults.length / totalExecutableStatements,
    rankings: [...rankings.values()],
  };
};

export type BenchmarkData = {
  [algorithmName: string]: number;
};

const sbflAlgorithms = [
  { name: 'dstar-1', scoringFn: (a, b) => dStar(a, b, 1) },
  { name: 'dstar-2', console: true, scoringFn: (a, b) => dStar(a, b, 2) },
  { name: 'dstar-3', scoringFn: (a, b) => dStar(a, b, 3) },
  { name: 'dstar-4', scoringFn: (a, b) => dStar(a, b, 4) },
  { name: 'dstar-5', scoringFn: (a, b) => dStar(a, b, 5) },
  { name: 'ochiai', scoringFn: ochiai },
  { name: 'tarantula', scoringFn: tarantula },
  { name: 'barinel', scoringFn: barinel },
  { name: 'op2', scoringFn: op2 },
];

const log = createLogger({ level: 'verbose' });

const faultFileDir = (projectDir: string, sbflModuleFolderName: string) => {
  const faultPath = resolve(projectDir, 'faults', sbflModuleFolderName);
  return faultPath;
};

const faultFilePath = (projectDir: string, sbflModuleFolderName: string) => {
  return resolve(faultFileDir(projectDir, sbflModuleFolderName), 'faults.json');
};

const findConfig = (
  benchmarkConfig: BenchmarkConfig,
  path: string,
): ProjectConfig | null => {
  for (const projectConfig of benchmarkConfig) {
    const globs = Array.isArray(projectConfig.glob)
      ? projectConfig.glob
      : [projectConfig.glob];

    const resolvedGlobs = globs.map((glob) =>
      resolve('./projects', glob).replace(/\\+/g, '/'),
    );

    if (micromatch.isMatch(path, resolvedGlobs)) {
      return projectConfig;
    }
  }
  return null;
};

export const run = async () => {
  const projectDirs = await requestProjectDirs(
    process.argv.length <= 2 ? undefined : process.argv.slice(2),
  );

  const runOnProject = async (projectDir: string) => {
    log.verbose(`Starting ${projectDir}...`);

    const selectedConfig = findConfig(benchmarkConfig, projectDir);
    if (selectedConfig === null) {
      log.warn(`Could not find an explicit config for '${chalk.cyanBright(projectDir)}'`);
    }
    const projectConfig = selectedConfig === null ? {} : selectedConfig;
    const {
      setupFiles = [resolve(__dirname, './hooks/babel')],
      tester = '@fault/tester-mocha',
      testOptions,
      babelOptions,
    } = projectConfig;
    const { sandbox = false, mocha = require.resolve('mocha') } =
      testOptions === undefined ? {} : testOptions;
    const optionsEnv = projectConfig.env ? projectConfig.env : {};

    const testMatch = (
      projectConfig.testMatch
        ? Array.isArray(projectConfig.testMatch)
          ? projectConfig.testMatch
          : [projectConfig.testMatch]
        : ['**/*.test.{js,jsx,ts,tsx}']
    ).map((filePath) => resolve(projectDir, filePath).replace(/\\+/g, '/'));

    const projectOutput = {};

    log.verbose(`Running SBFL algorithms on ${projectDir}`);

    const ignoreGlob =
      '!../{fault-messages,fault-tester-mocha,fault-addon-mutation-localization,fault-addon-mutation-localization-v1,fault-istanbul-util,fault-runner,fault-addon-hook-schema,hook-schema,fault-record-faults,fault-addon-istanbul,fault-types}/**/*';
    const sbflAddons = sbflAlgorithms.map(({ scoringFn, name, console = false }) => {
      const sbflAddon = createPlugin({
        scoringFn: scoringFn,
        faultFilePath: faultFilePath(projectDir, name),
        ignoreGlob,
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
      workers: 1,
      fileBufferCount: sandbox ? undefined : null,
      timeout: 60000,
    };

    // SBFL
    await flRunner.run({
      ...commonRunnerOptions,
      addons: sbflAddons,
    });

    const coverage = await readCoverageFile(
      resolve(projectDir, 'coverage/coverage-final.json'),
    );

    const mutationPlugins = [
      {
        name: 'mbfl',
        path: '@fault/addon-mutation-localization-v1',
        skipEvaluation: true,
      },
      {
        name: 'mbfl-new',
        path: '@fault/addon-mutation-localization',
        skipEvaluation: true,
      },
    ];

    for (const { name, path } of mutationPlugins.filter(
      (config) => config.skipEvaluation !== true,
    )) {
      const addon = await import(path);
      await flRunner.run({
        ...commonRunnerOptions,
        addons: [
          addon.default({
            faultFileDir: faultFileDir(projectDir, name),
            ignoreGlob,
            mapToIstanbul: true,
            console: true,
            babelOptions,
            processOptions: {},
            // allowPartialTestRuns: sandbox,
          }),
        ],
      });
    }

    const expectedFaults = convertFileFaultDataToFaults(
      await readJson(resolve(projectDir, 'expected-faults.json')),
    ) as ExpectedFault[];

    for (const { name } of sbflAlgorithms as any) {
      const actualFaults = convertFileFaultDataToFaults(
        await readJson(resolve(faultFilePath(projectDir, name))),
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
    await writeJson(faultResultsPath, projectOutput, undefined, 2);
  };

  for (const projectDir of projectDirs) {
    await runOnProject(resolve(__dirname, projectDir));
  }
};
