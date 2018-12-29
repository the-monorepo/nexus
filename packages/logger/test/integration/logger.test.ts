import MockDate from 'mockdate';

import { logger, consoleTransport } from '../../src/index';
import { testCases } from '../util/testCases';

// We're removing color codes from logging
jest.mock('winston', () => {
  const { mockFormatter } = require('../util/mockFormatter');
  const actualModule = require.requireActual('winston');
  Object.defineProperty(actualModule.format, 'colorize', { value: mockFormatter() });
  return actualModule;
});

jest.mock('@pshaw/winston-formats', () => {
  const { mockFormatter } = require('../util/mockFormatter');
  const actualModule = require.requireActual('@pshaw/winston-formats');
  actualModule.colorize = mockFormatter();
  const ogObjectsFormatter = actualModule.objects;
  actualModule.objects = ({ ...other }) =>
    ogObjectsFormatter({ ...other, colors: false });
  return actualModule;
});

// Set timezone to const value then adjust for timezone
MockDate.set('2018-05-03T12:34:56z');
const tempdate = new Date();
const adjustedTime = tempdate.getTime() + tempdate.getTimezoneOffset() * 60 * 1000;
MockDate.set(adjustedTime);

// replace stdout.write so we can capture output
const mockedWrite = jest.fn();
(console as any)._stdout = { write: mockedWrite };

const log = logger().add(consoleTransport({ level: 'debug' }));
const levelName = 'info';

function formatExpected(expectedString) {
  const prefix: string = '2018-05-03 12:34:56 ';
  const padding: string = ' '.repeat(9 - levelName.length);
  const output: string = `${prefix}${levelName}${padding}${expectedString}\n`;
  return output;
}

describe(levelName + ' logger tests', () => {
  for (const testCase of testCases) {
    it(testCase.name, () => {
      (log.info as any)(...testCase.input);
      expect(mockedWrite).toHaveBeenCalledTimes(1);
      // Trimming to ignore inconsistencies with \rs
      const printedMessage = mockedWrite.mock.calls[0][0].replace('\r', '');
      if (typeof testCase.output === 'string') {
        expect(printedMessage).toBe(formatExpected(testCase.output).replace('\r', ''));
      } else {
        expect(printedMessage).toMatch(testCase.output);
      }
    });
  }
});
