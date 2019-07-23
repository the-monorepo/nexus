import { Fault } from '@fault/addon-sbfl';
import { writeFile, readFile } from 'mz/fs';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { ExpressionLocation } from '@fault/istanbul-util';

export type FileFault = {
  score: number;
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
        };
        faults.push(fault);
      }
    }
  }

  return faults;
};

export const recordFaults = (filePath: string, faults: Fault[]) => {
  mkdirSync(dirname(filePath), { recursive: true });
  const faultsData = {};
  for (const fault of faults) {
    if (fault.score === null) {
      continue;
    }
    const recordedItem = {
      score: fault.score,
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
