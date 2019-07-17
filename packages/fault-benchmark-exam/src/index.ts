import { ScorelessFault } from '@fault/addon-sbfl';
import { readFaultFile, convertFileFaultDataToFaults, recordFaults } from '@fault/record-faults';
import { mkdirSync } from 'fs';
import { writeFile, readdir } from 'mz/fs';
import { readCoverageFile, getTotalExecutedStatements } from '@fault/istanbul-util';
import { PartialTestHookOptions } from '@fault/addon-hook-schema';
import { basename } from 'path';

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

export const measureFromFiles = async (
  actualFaultFiles: { name: string, path: string }[],
  expectedFaultFile: string,
  fileOutputPath: string = './fault-benchmark.json',
  coveragePath?: string,
) => {
  const expectedFaultFileData = await readFaultFile(expectedFaultFile);

  const expectedFaults: ScorelessFault[] = convertFileFaultDataToFaults(expectedFaultFileData);

  const output: BenchmarkData = {};
  
  const coverage = await readCoverageFile(coveragePath);
  const totalExecutableStatements = getTotalExecutedStatements(coverage);

  for(const faultFilePath of actualFaultFiles) {
    const faultFileData = await readFaultFile(faultFilePath.path);
    const faults = convertFileFaultDataToFaults(faultFileData);
    const examScore = calculateExamScore(faults, expectedFaults, totalExecutableStatements);
    output[faultFilePath.name] = examScore;
  }
 
  mkdirSync(fileOutputPath, { recursive: true });
  await writeFile(fileOutputPath, JSON.stringify(output), { encoding: 'utf8', flag: 'w+' });
}

export const createPlugin = (directoryPath: string, expectedFaultFilePath: string, fileOutputPath: string): PartialTestHookOptions => {
  const plugin: PartialTestHookOptions = {
    on: {
      complete: async () => {
        const filePaths: string[] = await readdir(directoryPath);
        const faultFileDataInfo = filePaths.map(filePath => ({
          name: basename(filePath),
          path: filePath
        }));
        
        await measureFromFiles(faultFileDataInfo, expectedFaultFilePath, fileOutputPath);
      }
    }
  };  
  return plugin;
};

export default createPlugin;