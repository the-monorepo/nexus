import { submitTestResult } from 'fl-addon-core';
import { createHash } from 'crypto';
import { subtractCoverage } from 'fl-istanbul-util';
import Mocha from 'mocha';
const {
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_RUN_BEGIN,
  EVENT_HOOK_BEGIN
} = (Mocha.Runner as any).constants;
const COVERAGE_KEY = '__coverage__';

const commonTestHandle = submitHandle => {
  return async (test, err) => {
    const coverage = subtractCoverage(global[COVERAGE_KEY], global.beforeTestCoverage);
    const hash = createHash('sha1')
      .update(test!.body)
      .digest('base64');
    const duration = test.duration! * 1000;
    const file = test.file!;
    const fullTitle = test.fullTitle();
    await submitHandle({ hash, duration, file, fullTitle, coverage }, test, err);
  };
};

export class IPCReporter {
  constructor(runner) {
    runner
      .on(
        EVENT_TEST_PASS,
        commonTestHandle(async testData => {
          console.log('record pass')
          await submitTestResult({
            ...testData,
            passed: true,
          });
        }),
      )
      .on(
        EVENT_TEST_FAIL,
        commonTestHandle(async (testData, test, err) => {
          console.log('record fail')
          await submitTestResult({
            ...testData,
            passed: false,
            stack: err.stack,
          });
        }),
      )
      .on(EVENT_SUITE_BEGIN, () => {
        console.log('start');
      })
      .on(EVENT_SUITE_END, () => {
        console.log('end');
      })
      .on(EVENT_RUN_BEGIN, () => {
        console.log('hook');
      })
  }
}
