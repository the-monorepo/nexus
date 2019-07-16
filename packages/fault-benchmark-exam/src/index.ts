import { ScorelessFault, Fault } from '@fault/addon-sbfl';
import { readFaultFile, convertFileFaultDataToFaults } from '@fault/record-faults';
import { mkdirSync } from 'fs';
import { writeFile } from 'mz/fs';
import { readCoverageFile, getTotalExecutedStatements } from '@fault/istanbul-util';

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