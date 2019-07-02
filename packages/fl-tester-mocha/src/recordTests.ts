import { submitTestResult } from 'fl-addon-core';
import { createHash } from 'crypto';
afterEach(async function() {
  const passed = this.currentTest!.isPassed();
  if (passed) {
    await submitTestResult({
      passed: true,
      hash: createHash('sha1')
        .update(this.currentTest!.body)
        .digest('base64'),
      duration: this.currentTest!.duration! * 1000,
      file: this.currentTest!.file!,
      fullTitle: this.currentTest!.fullTitle(),
      coverage: {},
    });  
  } else {
    await submitTestResult({
      passed: false,
      hash: createHash('sha1')
        .update(this.currentTest!.body)
        .digest('base64'),
      duration: this.currentTest!.duration! * 1000,
      file: this.currentTest!.file!,
      fullTitle: this.currentTest!.fullTitle(),
      coverage: {},
      stack: this.currentTest!.err!.stack
    });  
  }
});
