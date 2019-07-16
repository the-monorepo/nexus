import { ScorelessFault } from '@fault/addon-sbfl';

export const faultToKey = (fault: ScorelessFault): string => {
  return `${fault.sourcePath}:${fault.location.start.line}:${fault.location.start.column}`;
}

export const measure = (actualFaults: ScorelessFault[], expectedFaults: ScorelessFault[], totalExecutableStatements: number) => {
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

export default measure;