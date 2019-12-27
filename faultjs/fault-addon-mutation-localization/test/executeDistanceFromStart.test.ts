import { executionDistanceFromStart } from '../src';
import { readFile } from 'mz/fs';
import { parse } from '@babel/parser';
import ErrorStackParser from 'error-stack-parser';

const throwAnError = (further: boolean) => {
  if (!further) {
    throw new Error('closer');
  }
  throw new Error('further');
};

it('executionDistanceFromStart', async () => {
  let closerErr: Error = null!;
  let furtherErr: Error = null!;
  try {
    throwAnError(false);
  } catch(err) {
    closerErr = err;
  }

  try {
    throwAnError(true);
  } catch(err) {
    furtherErr = err;
  }

  const code = await readFile(__filename, 'utf8');

  const ast = parse(code, { sourceType: 'module', plugins: ['typescript'] });

  const closerStackFrame = ErrorStackParser.parse(closerErr)[0];
  const furtherStackFrame = ErrorStackParser.parse(furtherErr)[0];

  const closerDistance = executionDistanceFromStart(ast, closerStackFrame.lineNumber, closerStackFrame.columnNumber);
  const furtherDistance = executionDistanceFromStart(ast, furtherStackFrame.lineNumber, furtherStackFrame.columnNumber);

  expect(closerDistance).not.toBeNull();
  expect(furtherDistance).not.toBeNull();
  expect(closerDistance).toBeLessThan(furtherDistance);
});