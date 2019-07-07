import { subtractCoverage } from '@fault/istanbul-util';
import Mocha from 'mocha';
import { submitTestResult } from '@fault/messages';
import { createHash } from 'crypto';
const {
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_RUN_BEGIN,
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
  public constructor(runner) {
    runner
      .on(
        EVENT_TEST_PASS,
        commonTestHandle(async testData => {
          await submitTestResult({
            ...testData,
            passed: true,
          });
        }),
      )
      .on(
        EVENT_TEST_FAIL,
        commonTestHandle(async (testData, test, err) => {
          await submitTestResult({
            ...testData,
            passed: false,
            stack: err.stack,
          });
        }),
      );
  }
}
