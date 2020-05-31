function testCase(name, input, output) {
  return { name, input, output };
}

export const testCases = [
  testCase('undefined', [undefined], 'undefined'),
  testCase('empty string', [''], ''),
  testCase('single character', ['a'], 'a'),
  testCase('simple string', ['a message :)'], 'a message :)'),
  testCase(
    'list of strings',
    [['test', 'test2', 'test3']],
    "[ 'test', 'test2', 'test3' ]",
  ),
  testCase('multiple parameters', ['this', 'is', 'a', 'test'], 'this is a test'),
  testCase('json', [{ also: 'a', test: ':D' }], "{ also: 'a', test: ':D' }"),
  testCase('number', [0], '0'),
  testCase('function', [() => {}], /\[Function/),
  testCase('regex', [/reaewr/g], '/reaewr/g'),
  testCase('error', [new Error('Test error logging')], /Error: Test error logging/),
];
