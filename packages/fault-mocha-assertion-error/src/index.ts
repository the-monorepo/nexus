import { AssertionType } from '@fault/addon-message-types/src/assertion-types';
export type AssertionData = {
  assertionType: AssertionType;
  expected: any;
  actual: any;
  message: any;
  stackFrames: any[];
}
export class AssertionError extends Error {
  constructor(
    public data: AssertionData
  ) {
    super();
  }
}
