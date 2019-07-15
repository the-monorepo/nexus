import { AssertionType } from '@fault/types';
export type AssertionData = {
  assertionType: AssertionType;
  expected: any;
  actual: any;
  stackFrames: any[];
  message: string;
  stack: string;
};
export class AssertionError extends Error {
  constructor(public data: AssertionData) {
    super();
  }
}
