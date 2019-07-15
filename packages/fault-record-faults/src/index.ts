import { Fault } from '@fault/addon-sbfl';
import { writeFile } from 'mz/fs';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

export const recordFaults = (filePath: string, faults: Fault[]) => {
  mkdirSync(dirname(filePath), { recursive: true });
  const faultsData = {};
  for(const fault of faults) {
    if (fault.score === null) {
      continue;
    }
    const recordedItem = {
      score: fault.score,
      location: fault.location
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
  return writeFile(filePath, JSON.stringify(faultsData), { encoding: 'utf8', flag: 'w+' });
}