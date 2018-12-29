// TODO: Maybe disable this rule for this package
/* eslint-disable no-console */

import { mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { dirname, relative } from 'path';

import chalk from 'chalk';

import { ExpressionLocation } from '@fault/istanbul-util';
import { readJson, writeJson } from '@pshaw/fs';

export type ScorelessFault = {
  location: ExpressionLocation;
  sourcePath: string;
  other?: {
    [s: string]: any;
  };
};

export type ScoreHolder = {
  score: number | null;
};

export type Fault = ScoreHolder & ScorelessFault;

export type FileFault = {
  score: number | boolean | null;
  location: ExpressionLocation;
};

export type SourceFileFaults = FileFault[];

export type FaultData = {
  [sourceFilePath: string]: SourceFileFaults;
};

export const readFaultFile = async (filePath: string): Promise<FaultData> => {
  return await readJson(filePath);
};

const createComparisonError = (a: Fault, b: Fault) => {
  return new Error(
    `Shouldn't get here. Was comparing ${JSON.stringify(a)} and ${JSON.stringify(b)}`,
  );
};

export const sortBySuspciousness = (faults: Fault[]) => {
  return faults.sort((a, b) => {
    if (a.score === b.score) {
      const locationComparison = compareLocation(a, b);
      return locationComparison;
    }
    if (a.score === null) {
      return -1;
    }
    if (b.score === null) {
      return 1;
    }
    if (a.score < b.score) {
      return 1;
    }
    if (a.score > b.score) {
      return -1;
    }

    throw createComparisonError(a, b);
  });
};

export const convertFileFaultDataToFaults = (faultData: FaultData): Fault[] => {
  const faults: Fault[] = [];
  for (const sourceFilePath of Object.keys(faultData)) {
    const sourceFileFaults = faultData[sourceFilePath];
    for (const fileFault of sourceFileFaults) {
      const fault: Fault = {
        ...fileFault,
        sourcePath: sourceFilePath,
        score:
          fileFault.score === true
            ? Number.POSITIVE_INFINITY
            : fileFault.score === false
            ? Number.NEGATIVE_INFINITY
            : fileFault.score,
      };
      faults.push(fault);
    }
  }

  sortBySuspciousness(faults);
  return faults;
};

export const compareLocation = (faultA: Fault, faultB: Fault): number | null => {
  const a = faultA.location;
  const b = faultB.location;
  if (a.start.line !== b.start.line) {
    return a.start.line - b.start.line;
  } else if (a.start.column !== b.start.column) {
    return a.start.column - b.start.column;
  } else if (a.end.line !== b.end.line) {
    return a.end.line - b.end.line;
  } else if (a.end.column !== b.end.column) {
    return a.end.column - b.end.column;
  }
  return 0;
};

export const sortByLocation = (fileFaults: Fault[]) => {
  fileFaults.sort((faultA, faultB) => {
    const locationComparison = compareLocation(faultA, faultB);
    if (locationComparison !== 0) {
      return locationComparison;
    }
    throw createComparisonError(faultA, faultB);
  });
};

export const recordFaults = (filePath: string, toRecord: Fault[]) => {
  const faults = [...toRecord];
  mkdirSync(dirname(filePath), { recursive: true });
  sortBySuspciousness(faults);
  const faultsData = {};
  for (const fault of faults) {
    if (Number.isNaN(fault.score)) {
      throw new Error(`${fault.score} is not a valid score value`);
    }
    const recordedItem = {
      score:
        fault.score === null
          ? null
          : Number.POSITIVE_INFINITY === fault.score
          ? true
          : Number.NEGATIVE_INFINITY === fault.score
          ? false
          : fault.score,
      location: fault.location,
      other: fault.other,
    };
    if (faultsData[fault.sourcePath] === undefined) {
      faultsData[fault.sourcePath] = [recordedItem];
    } else {
      faultsData[fault.sourcePath].push(recordedItem);
    }
  }
  return writeJson(filePath, faultsData, undefined, 2, {
    flag: 'w+',
  });
};

const simplifyPath = (absoluteFilePath) => relative(process.cwd(), absoluteFilePath);

export const reportFaults = async (faults: Fault[]) => {
  const rankedFaults = sortBySuspciousness(
    faults
      .filter(
        (fault) =>
          fault.score !== null &&
          fault.score !== Number.NEGATIVE_INFINITY &&
          !Number.isNaN(fault.score),
      )
      .sort((f1, f2) => f2.score! - f1.score!),
  ).slice(0, 10);
  for (const fault of rankedFaults) {
    const lines = (await readFile(fault.sourcePath, 'utf8')).split('\n');
    console.log(
      `${simplifyPath(fault.sourcePath)}:${fault.location.start.line}:${
        fault.location.start.column
      }, ${chalk.cyanBright(
        fault.score !== null && fault.score !== undefined
          ? String(fault.score)
          : 'undefined',
      )}`,
    );
    let l = fault.location.start.line - 1;
    let lineCount = 0;
    const maxLineCount = 3;
    while (l < fault.location.end.line - 1 && lineCount < maxLineCount) {
      console.log(chalk.gray(lines[l++]));
      lineCount++;
    }
    const lastLine = lines[l++];
    console.log(chalk.gray(lastLine));
    if (lineCount >= maxLineCount) {
      const spaces = lastLine.match(/^ */)![0];
      console.log(chalk.gray(`${new Array(spaces.length + 1).join(' ')}...`));
    }
    console.log();
  }
};
