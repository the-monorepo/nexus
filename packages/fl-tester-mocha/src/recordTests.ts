import { submitTestResult } from 'fl-addon-core';
import { createHash } from 'crypto'; 
afterEach(async function() {
  await submitTestResult({
    passed: this.currentTest!.isPassed(),
    hash: createHash('sha1').update(this.currentTest!.body).digest('base64'),
    duration: this.currentTest!.duration! * 1000,
    file: this.currentTest!.file!,
    fullTitle: this.currentTest!.fullTitle(),
    coverage: {}
  });
});
