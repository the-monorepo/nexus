import { Fault } from '@fault/addon-sbfl';
import { writeFile, readFile } from 'mz/fs';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { ExpressionLocation } from '@fault/istanbul-util';

export type FileFault = {
  score: number | boolean | null;
  location: ExpressionLocation;
};

export type SourceFileFaults = FileFault[];

export type FaultData = {
  [sourceFilePath: string]: SourceFileFaults;
};

export const readFaultFile = async (filePath: string): Promise<FaultData> => {
  const jsonText = await readFile(filePath, 'utf8');
  return JSON.parse(jsonText);
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
      if (locationComparison !== null) {
        return locationComparison;
      }
      return 0;
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
        sourcePath: sourceFilePath,
        ...fileFault,
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
    return a.end.line - a.end.line;
  } else if (a.end.column !== b.end.column) {
    return a.end.column - b.end.column;
  }
  return null;
};

export const sortByLocation = (fileFaults: Fault[]) => {
  fileFaults.sort((faultA, faultB) => {
    const locationComparison = compareLocation(faultA, faultB);
    if (locationComparison !== null) {
      return locationComparison;
    }
    throw createComparisonError(faultA, faultB);
  });
};

export const recordFaults = (filePath: string, faults: Fault[]) => {
  mkdirSync(dirname(filePath), { recursive: true });
  const faultsData = {};
  for (const fault of faults) {
    const recordedItem = {
      score:
        fault.score === null
          ? null
          : Number.isNaN(fault.score)
          ? false
          : Number.POSITIVE_INFINITY === fault.score
          ? true
          : Number.NEGATIVE_INFINITY === fault.score
          ? false
          : fault.score,
      location: fault.location,
    };
    if (faultsData[fault.sourcePath] === undefined) {
      faultsData[fault.sourcePath] = [recordedItem];
    } else {
      faultsData[fault.sourcePath].push(recordedItem);
    }
  }
  return writeFile(filePath, JSON.stringify(faultsData, undefined, 2), {
    encoding: 'utf8',
    flag: 'w+',
  });
};
