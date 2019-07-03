import { submitTestResult } from 'fl-addon-core';
import { createHash } from 'crypto';
import Mocha from 'mocha';
const { 
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
} = (Mocha.Runner as any).constants;
const COVERAGE_KEY = '__coverage__';

const commonTestHandle = (submitHandle) => {
  return async (test, err) => {
    const hash = createHash('sha1')
      .update(test!.body)
      .digest('base64');
    const duration = test.duration! * 1000;
    const file = test.file!;
    const fullTitle = test.fullTitle();
    const coverage = global[COVERAGE_KEY];
    await submitHandle({ hash, duration, file, fullTitle, coverage }, test, err);
  }
}

export class IPCReporter {
  constructor(runner) {
    runner.on(EVENT_TEST_PASS, commonTestHandle(async (testData) => {
      await submitTestResult({
        ...testData,
        passed: true
      });
    })).on(EVENT_TEST_FAIL, commonTestHandle(async (testData, test, err) => {
      await submitTestResult({
        ...testData,
        passed: false,
        stack: err.stack,
      });
    }));
  }
}
/*
afterEach(async function() {
  if (passed) {
  } else {
    await submitTestResult({
      passed: false,
      hash,
      duration,
      file,
      fullTitle,
      coverage,
      stack: this.currentTest!.err!.stack
    });  
  }
});
*/