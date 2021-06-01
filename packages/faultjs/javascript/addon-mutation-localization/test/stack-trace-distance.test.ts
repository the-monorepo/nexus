import { readFileSync } from 'fs';

import { parse } from '@babel/parser';

import ErrorStackParser from 'error-stack-parser';

import { TestResult } from '@fault/types';

import { executionDistanceFromStart, evaluateStackDifference } from '../src/index.ts';

const stubTestResult = (key: string, stack): TestResult => ({
  type: 'submit-test-result',
  id: 1,
  data: {
    key,
    titlePath: [],
    file: __filename,
    coverage: {},
    passed: true,
    stack,
  },
});

const throwAnError = (further: boolean) => {
  if (!further) {
    throw new Error('closer');
  }
  throw new Error('further');
};
describe('stack trace distance', () => {
  let closerErr: Error = null!;
  let furtherErr: Error = null!;

  try {
    throwAnError(false);
  } catch (err) {
    closerErr = err;
  }

  try {
    throwAnError(true);
  } catch (err) {
    furtherErr = err;
  }

  const code = readFileSync(__filename, 'utf8');

  const ast = parse(code, { sourceType: 'module', plugins: ['typescript'] });

  const closerStackFrame = ErrorStackParser.parse(closerErr)[0];
  const furtherStackFrame = ErrorStackParser.parse(furtherErr)[0];

  it(executionDistanceFromStart.name, () => {
    const closerDistance = executionDistanceFromStart(
      ast,
      closerStackFrame.lineNumber!,
      closerStackFrame.columnNumber!,
    );
    const furtherDistance = executionDistanceFromStart(
      ast,
      furtherStackFrame.lineNumber!,
      furtherStackFrame.columnNumber!,
    );

    expect(closerDistance).not.toBeNull();
    expect(furtherDistance).not.toBeNull();
    expect(closerDistance).toBeLessThan(furtherDistance!);
  });

  it(evaluateStackDifference.name, () => {
    const key = '1';
    const oldTestResult = stubTestResult(key, closerErr.stack);
    const newTestResult = stubTestResult(key, furtherErr.stack);

    const astMap = new Map([[oldTestResult.data.file, ast]]);

    const difference = evaluateStackDifference(oldTestResult, newTestResult, astMap)!;

    expect(difference).not.toBeNull();
    expect(difference).toBeGreaterThan(0);

    const noDifferene = evaluateStackDifference(oldTestResult, oldTestResult, astMap);
    expect(noDifferene).toBe(0);

    const oppositeDifference = evaluateStackDifference(
      newTestResult,
      oldTestResult,
      astMap,
    );
    expect(oppositeDifference).toBe(-difference);
  });
});
