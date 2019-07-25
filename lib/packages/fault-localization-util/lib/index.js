'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.passFailStatsFromTests = void 0;

const passFailStatsFromTests = testResults => {
  const stats = {
    passed: 0,
    failed: 0,
  };

  for (const testResult of testResults) {
    if (testResult.passed) {
      stats.passed++;
    } else {
      stats.failed++;
    }
  }

  return stats;
};

exports.passFailStatsFromTests = passFailStatsFromTests;
//# sourceMappingURL=index.js.map
