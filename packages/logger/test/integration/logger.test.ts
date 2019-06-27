import { mock, stub } from 'sinon';
import MockDate from 'mockdate';

import { logger, consoleTransport, fileTransport } from '../../src/index';
import { testCases } from '../util/testCases';
import * as winston from 'winston';
import { mockFormatter } from '../util/mockFormatter';
import * as winstonFormats from '@pshaw/winston-formats';
// We're removing color codes from logging
Object.defineProperty(winston.format, 'colorize', { value: mockFormatter() });
Object.defineProperty(winston.transports, 'File', {
  value: winston.transports.Console,
});
mock(winston, 'winston');


Object.defineProperty(winstonFormats, 'colorize', { value: mockFormatter() });
const ogObjectsFormatter = winstonFormats.objects;
Object.defineProperty(winstonFormats, 'objects', { 
  value: ({ ...other }) =>
    ogObjectsFormatter({ ...other, colors: false })
});
mock(winstonFormats, '@pshaw/winston-formats');


// Set timezone to const value then adjust for timezone
MockDate.set('2018-05-03T12:34:56z');
const tempdate = new Date();
const adjustedTime = tempdate.getTime() + tempdate.getTimezoneOffset() * 60 * 1000;
MockDate.set(adjustedTime);

// replace stdout.write so we can capture output
const mockedWrite = stub();
(console as any)._stdout = { write: mockedWrite };

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
  'console-default-double-tagged': {
    log: logger()
      .add(consoleTransport())
      .child({ tags: ['hello', 'world'] }),
    formatExpected: string =>
      formatTester({ timestamp: '12:34:56 ' })(`[hello][world] ${string}`),
  },
};

Object.keys(loggers).forEach(loggerName => {
  const { formatExpected = formatTester(), log, writeFn = mockedWrite } = loggers[
    loggerName
  ];

  describe(loggerName, () => {
    describe(`${levelName} logger tests`, () => {
      for (const testCase of testCases) {
        it(testCase.name, () => {
          (log[levelName] as any)(...testCase.input);
          expect(writeFn).to.have.callCount(1);
          // Trimming to ignore inconsistencies with \rs
          const printedMessage = writeFn.returnValues[0].replace('\r', '');
          if (typeof testCase.output === 'string') {
            expect(printedMessage).to.be(
              formatExpected(testCase.output).replace('\r', ''),
            );
          } else {
            expect(printedMessage).to.match(testCase.output);
          }
        });
      }
    });
  });
});
