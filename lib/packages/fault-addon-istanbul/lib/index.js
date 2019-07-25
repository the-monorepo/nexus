'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = exports.defaultPlugin = exports.createPlugin = exports.report = void 0;

var _istanbulLibReport = require('istanbul-lib-report');

var _istanbulReports = require('istanbul-reports');

var _istanbulLibCoverage = require('istanbul-lib-coverage');

const report = ({ testResults }, contextOptions) => {
  const totalCoverage = (0, _istanbulLibCoverage.createCoverageMap)({});

  for (const { coverage } of testResults.values()) {
    totalCoverage.merge(coverage);
  }

  const context = (0, _istanbulLibReport.createContext)(contextOptions);

  const tree = _istanbulLibReport.summarizers.pkg(totalCoverage);

  ['json', 'lcov', 'text'].forEach(reporter =>
    tree.visit((0, _istanbulReports.create)(reporter, {}), context),
  );
};

exports.report = report;

const createPlugin = contextOptions => {
  const plugin = {
    on: {
      complete: testerResults => {
        report(testerResults, contextOptions);
      },
    },
  };
  return plugin;
};

exports.createPlugin = createPlugin;
const defaultPlugin = createPlugin(undefined);
exports.defaultPlugin = defaultPlugin;
var _default = defaultPlugin;
exports.default = _default;
//# sourceMappingURL=index.js.map
