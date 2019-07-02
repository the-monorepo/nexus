export const finishedTests: any[] = [];
afterEach(function() {
  finishedTests.push({
    passed: this.passed === 'passed',
    duration: this.duration * 1000,
    file: this.file,
  });
});
