import { createHash } from 'crypto';

import Mocha from 'mocha';

import { subtractCoverage, Coverage } from '@fault/istanbul-util';

import { client } from './client.ts';

const { EVENT_TEST_FAIL, EVENT_TEST_PASS, EVENT_TEST_BEGIN } = (Mocha.Runner as any)
  .constants;
const COVERAGE_KEY = '__coverage__';

type PartialTestData = {
  key: string;
  file: string;
  titlePath: string[];
  duration: number;
  coverage: Coverage;
};

type SubmitHandle = (testData: PartialTestData, test: Mocha.Test, err?: any) => any;
const commonTestHandle = (submitHandle: SubmitHandle) => {
  return (test: Mocha.Test, err) => {
    const coverage = subtractCoverage(
      globalThis[COVERAGE_KEY],
      globalThis.beforeTestCoverage,
    );
    const hash =
      test!.titlePath().join('_') +
      createHash('sha1').update(test!.body).digest('base64');
    const duration = test.duration! * 1000;
    const file = test.file!;
    const titlePath = test.titlePath();
    return submitHandle({ key: hash, duration, file, titlePath, coverage }, test, err);
  };
};

export class IPCReporter {
  public constructor(runner) {
    runner
      .on(EVENT_TEST_BEGIN, (testData: Mocha.Test) => {
        client.notifyWorkingOnTest({
          titlePath: testData.titlePath(),
          file: testData.file!,
        });
      })
      .on(
        EVENT_TEST_PASS,
        commonTestHandle((testData) => {
          return client.submitTestResult({
            ...testData,
            passed: true,
          });
        }),
      )
      .on(
        EVENT_TEST_FAIL,
        commonTestHandle((testData, test, err) => {
          const stack = err.stack;
          return client.submitTestResult({
            ...testData,
            passed: false,
            stack,
          });
        }),
      );
  }
}
