import { Fault } from '@fault/addon-sbfl';

export const sortFaults = (faults: Fault[]) => {
  faults.sort((a, b) => {
    if (a.score === b.score) {
      return 0;
    } else if (a.score === null) {
      return -1;
    } else if (b.score === null) {
      return 1;
    } else if (a.score > b.score) {
      return 1;
    } else {
      return -1;
    }
  });
}

export const faultToKey = (fault: Fault): string => {
  return `${fault.location.start.line}:${fault.location.start.column}`;
}

export const measure = (actualFaults: Fault[], expectedFaults: Set<number>) => {
  for(const fault of actualFaults) {
    
  }
}