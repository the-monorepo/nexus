import { submitTestResult } from 'fl-addon-core';
afterEach(async function() {
  await submitTestResult({
    passed: this.passed === 'passed',
    duration: this.duration * 1000,
    file: this.file,
    fullTitle: this.currentTest!.fullTitle(),
    coverage: {}
  });
});
