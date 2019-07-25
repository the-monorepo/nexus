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

export type TestFileFaults = {
  [sourceFilePath: string]: SourceFileFaults;
};

export type FaultData = {
  [testFilePath: string]: TestFileFaults;
};

export const readFaultFile = async (filePath: string): Promise<FaultData> => {
  const jsonText = await readFile(filePath, 'utf8');
  return JSON.parse(jsonText);
};

export const convertFileFaultDataToFaults = (faultData: FaultData): Fault[] => {
  const faults: Fault[] = [];

  for (const testFilePath of Object.keys(faultData)) {
    const testFileFaults = faultData[testFilePath];
    for (const sourceFilePath of Object.keys(testFileFaults)) {
      const sourceFileFaults = testFileFaults[sourceFilePath];
      for (const fileFault of sourceFileFaults) {
        const fault: Fault = {
          sourcePath: sourceFilePath,
          testedPath: testFilePath,
          ...fileFault,
          score: fileFault.score === true ? Number.POSITIVE_INFINITY : fileFault.score === false ? Number.NEGATIVE_INFINITY : fileFault.score
        };
        faults.push(fault);
      }
    }
  }

  return faults.sort((a, b) => {
    if (a.score === b.score) {
      return 0;
    }
    if (a.score === null) {
      return -1;
    }
    if (b.score === null) {
      return 1;
    }
    if (a.score < b.score) {
      return -1;
    }
    if (a.score > b.score) {
      return 1;
    }
    throw new Error(`Shouldn't get here. Was comparing ${a.score} and ${b.score}`);
  });
};

export const recordFaults = (filePath: string, faults: Fault[]) => {
  mkdirSync(dirname(filePath), { recursive: true });
  const faultsData = {};
  for (const fault of faults) {
    const recordedItem = {
      score: fault.score === null ? null : Number.isNaN(fault.score) ? false : Number.POSITIVE_INFINITY === fault.score ? true : Number.NEGATIVE_INFINITY === fault.score ? false : fault.score,
      location: fault.location,
    };
    if (faultsData[fault.testedPath] === undefined) {
      faultsData[fault.testedPath] = {};
    }
    const testFaults = faultsData[fault.testedPath];
    if (testFaults[fault.sourcePath] === undefined) {
      testFaults[fault.sourcePath] = [recordedItem];
    } else {
      testFaults[fault.sourcePath].push(recordedItem);
    }
  }
  return writeFile(filePath, JSON.stringify(faultsData, undefined, 2), {
    encoding: 'utf8',
    flag: 'w+',
  });
};
