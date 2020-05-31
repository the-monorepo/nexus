import { Writable } from 'stream';

import jest from 'jest-mock';
import MockDate from 'mockdate';

import createLogger from '../../src/index';
import { testCases } from '../util/testCases';

class MockedWriteable extends Writable {
  public readonly mockedWrite = jest.fn();
  _write(...args) {
    this.mockedWrite(...args);
  }
}

// Set timezone to const value then adjust for timezone
MockDate.set('2018-05-03T12:34:56z');
const tempdate = new Date();
const adjustedTime = tempdate.getTime() + tempdate.getTimezoneOffset() * 60 * 1000;
MockDate.set(adjustedTime);

const levelName = 'info';
function formatTester({ timestamp = '' }: any = {}) {
  return expectedString => {
    const padding: string = ' '.repeat(9 - levelName.length);
    const output = `${timestamp}${levelName}${padding} ${expectedString}\n`;
    return output;
  };
}

const loggers = {
  'console-default': {
    formatExpected: formatTester({ timestamp: '12:34:56 ' }),
  },
  'console-no-color-no-timestamp': {
    options: {
      colorMode: 'auto',
    },
    customOptions: {
      level: 'debug',
      timestampFormat: null,
    }
  },
  'console-with-full-timestamp': {
    customOptions: {
      timestampFormat: 'YYYY-MM-dd hh:mm:ss'
    },
    formatExpected: formatTester({ timestamp: '2018-05-03 12:34:56 ' }),
  },
  'console-default/double-tagged': {
    customOptions: {
      tags: ['hello', 'world']
    },
    formatExpected: string =>
      formatTester({ timestamp: '12:34:56 ' })(`[hello][world] ${string}`),
  },
};

Object.keys(loggers).forEach(loggerName => {
  const { formatExpected = formatTester(), options, customOptions } = loggers[
    loggerName
  ];

  describe(loggerName, () => {
    describe(`${levelName} logger tests`, () => {
      for (const testCase of testCases) {
        it(testCase.name, () => {
          const stubbedStdout = new MockedWriteable();

          const log = createLogger({
            ...options,
            stdout: stubbedStdout, 
            stderr: stubbedStdout,
            colorMode: false,
          }, {
            ...customOptions,
          });
        
          (log[levelName] as any)(...testCase.input);
          expect(stubbedStdout.mockedWrite).toHaveBeenCalledTimes(1);
          // Trimming to ignore inconsistencies with \rs
          const printedMessage = (stubbedStdout.mockedWrite.mock.calls[0][0] as any).toString('utf8').replace('\r', '');
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
