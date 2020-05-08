/* TODO: Get this to work without breaking Mocha
import { stub } from 'sinon';
import MockDate from 'mockdate';
import mock from 'rewiremock';
import { logger, consoleTransport, fileTransport } from '../../src/index';
import { testCases } from '../util/testCases';
import { mockFormatter } from '../util/mockFormatter';
import { stubFunctions } from 'sinon-stub-functions';
// We're removing color codes from logging
const winston = require('winston');
Object.defineProperty(winston.format, 'colorize', { value: mockFormatter() });
Object.defineProperty(winston.transports, 'File', {
  value: winston.transports.Console,
});
mock('winston').with(winston);

const winstonFormats = require('@pshaw/winston-formats');
Object.defineProperty(winstonFormats, 'colorize', { value: mockFormatter() });
const ogObjectsFormatter = winstonFormats.objects;
Object.defineProperty(winstonFormats, 'objects', { 
  value: ({ ...other }) =>
    ogObjectsFormatter({ ...other, colors: false })
});
mock('@pshaw/winston-formats').with(winstonFormats);
mock.enable();

// Set timezone to const value then adjust for timezone
MockDate.set('2018-05-03T12:34:56z');
const tempdate = new Date();
const adjustedTime = tempdate.getTime() + tempdate.getTimezoneOffset() * 60 * 1000;
MockDate.set(adjustedTime);

const levelName = 'info';
function formatTester({ timestamp = '' }: any = {}) {
  return expectedString => {
    const padding: string = ' '.repeat(9 - levelName.length);
    const output: string = `${timestamp}${levelName}${padding}${expectedString}\n`;
    return output;
  };
}

const loggers = {
  'console-default': {
    log: logger().add(consoleTransport({ level: 'debug' })),
    formatExpected: formatTester({ timestamp: '12:34:56 ' }),
  },
  'console-no-color-no-timestamp': {
    log: logger().add(
      consoleTransport({ level: 'debug', colors: false, timestamp: null }),
    ),
  },
  'file-default': {
    log: logger().add(fileTransport()),
    formatExpected: formatTester({ timestamp: '2018-05-03 12:34:56 ' }),
  },
  'console-default/double-tagged': {
    log: logger()
      .add(consoleTransport())
      .child({ tags: ['hello', 'world'] }),
    formatExpected: string =>
      formatTester({ timestamp: '12:34:56 ' })(`[hello][world] ${string}`),
  },
};

Object.keys(loggers).forEach(loggerName => {
  const { formatExpected = formatTester(), log } = loggers[
    loggerName
  ];

  describe(loggerName, () => {
    describe(`${levelName} logger tests`, () => {
      for (const testCase of testCases) {
        it(testCase.name, () => {
          // replace stdout.write so we can capture output
          const oldStdout = Object.getOwnPropertyDescriptor(console, '_stdout')!.value;
          const stubbedStdout = stubFunctions(oldStdout, { classInstances: true });
          Object.defineProperty(console, '_stdout', { value: stubbedStdout });
          
          (log[levelName] as any)(...testCase.input);
          expect(stubbedStdout.write).toHaveBeenCalledTimes(1);
          // Trimming to ignore inconsistencies with \rs
          const printedMessage = stubbedStdout.write.returnValues[0].replace('\r', '');
          if (typeof testCase.output === 'string') {
            expect(printedMessage).toBe(
              formatExpected(testCase.output).replace('\r', ''),
            );
          } else {
            expect(printedMessage).toMatch(testCase.output);
          }

          Object.defineProperty(console, '_stdout', { value: oldStdout });
        }); 
      }
    });
  });
});*/
