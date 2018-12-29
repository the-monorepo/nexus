import { Writable } from 'stream';

import * as jest from 'jest-mock';
import MockDate from 'mockdate';

import createLogger from '../../src/index.ts';
import { testCases } from '../util/testCases.ts';

class MockedWriteable extends Writable {
  public readonly mockedWrite = jest.fn();
  _write(...args) {
    this.mockedWrite(...args);
  }
}

const levelName = 'info';
const logLevelTag = 'ℹ️';
function formatTester({ timestamp = '' }: any = {}) {
  return (expectedString) => {
    const output = `${timestamp}${logLevelTag} ${expectedString}\n`;
    return output;
  };
}

const loggers = {
  'console-default': {
    formatExpected: formatTester({ timestamp: '13:34:56 ' }),
  },
  'console-no-color-no-timestamp': {
    options: {
      colorMode: 'auto',
    },
    customOptions: {
      level: 'debug',
      formatTimestamp: null,
    },
  },
  'console-with-full-timestamp': {
    customOptions: {
      formatTimestamp: () => 'test',
    },
    formatExpected: formatTester({ timestamp: 'test ' }),
  },
  'console-default/double-tagged': {
    customOptions: {
      tags: ['hello', 'world'],
    },
    formatExpected: (string) =>
      formatTester({ timestamp: '13:34:56 ' })(`[hello][world] ${string}`),
  },
};

Object.keys(loggers).forEach((loggerName) => {
  const { formatExpected = formatTester(), options, customOptions } = loggers[loggerName];

  describe(loggerName, () => {
    describe(`${levelName} logger tests`, () => {
      for (const testCase of testCases) {
        it(testCase.name, () => {
          const stubbedStdout = new MockedWriteable();

          const log = createLogger(
            {
              ...options,
              stdout: stubbedStdout,
              stderr: stubbedStdout,
              colorMode: false,
            },
            customOptions,
          );
          // Set timezone to const value then adjust for timezone
          MockDate.set('2018-05-03T13:34:56z');
          const tempdate = new Date();
          const adjustedTime =
            tempdate.getTime() + tempdate.getTimezoneOffset() * 60 * 1000;
          MockDate.set(adjustedTime);
          (log[levelName] as any)(...testCase.input);
          // TODO: Need to provide better isolation in FaultJS to avoid doing this
          MockDate.reset();
          expect(stubbedStdout.mockedWrite).toHaveBeenCalledTimes(1);
          // Trimming to ignore inconsistencies with \rs
          const printedMessage = (stubbedStdout.mockedWrite.mock.calls[0][0] as any)
            .toString('utf8')
            .replace('\r', '');
          if (typeof testCase.output === 'string') {
            expect(printedMessage).toBe(
              formatExpected(testCase.output).replace('\r', ''),
            );
          } else {
            expect(printedMessage).toMatch(testCase.output);
          }
        });
      }
    });
  });
});
