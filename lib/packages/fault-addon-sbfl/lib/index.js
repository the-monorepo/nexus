'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = exports.createPlugin = exports.localizeFaults = exports.gatherResults = void 0;

var _localizationUtil = require('@fault/localization-util');

var _recordFaults = require('@fault/record-faults');

var _sbflDstar = _interopRequireDefault(require('@fault/sbfl-dstar'));

var _path = require('path');

var _fs = require('mz/fs');

var _chalk = _interopRequireDefault(require('chalk'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const statementStr = (filePath, { start, end }) => {
  return `${filePath}:${start.line}:${start.column}|${end.line}:${end.column}`;
};

const gatherResults = testResults => {
  const expressionResults = new Map();

  for (const testResult of testResults) {
    const coverage = testResult.coverage;

    if (coverage === undefined) {
      continue;
    }

    for (const [filePath, fileCoverage] of Object.entries(coverage)) {
      const statementMap = fileCoverage.statementMap;

      for (const statementKey of Object.keys(statementMap)) {
        const executionCount = fileCoverage.s[statementKey];

        if (executionCount === 0) {
          continue;
        }

        const statementCoverage = statementMap[statementKey];
        const hash = statementStr(filePath, statementCoverage);

        const results = (() => {
          if (expressionResults.has(hash)) {
            return expressionResults.get(hash);
          } else {
            const passFailCounts = {
              passed: 0,
              failed: 0,
            };
            const newResult = {
              location: statementCoverage,
              stats: passFailCounts,
              testedPath: testResult.file,
              sourcePath: fileCoverage.path,
            };
            expressionResults.set(hash, newResult);
            return newResult;
          }
        })();

        results.stats[testResult.passed ? 'passed' : 'failed']++;
      }
    }
  }

  const fileResults = new Map();

  for (const expressionResult of expressionResults.values()) {
    const { sourcePath, testedPath } = expressionResult;

    if (!fileResults.has(expressionResult.sourcePath)) {
      fileResults.set(sourcePath, {
        sourcePath,
        testedPath,
        expressions: [expressionResult],
      });
    } else {
      const fileResult = fileResults.get(sourcePath);
      fileResult.expressions.push(expressionResult);
    }
  }

  return fileResults;
};

exports.gatherResults = gatherResults;

const localizeFaults = (groupedTestResults, fileResults, scoringFn) => {
  const faults = [];
  const selectedSourceFiles = new Set();

  for (const testResult of groupedTestResults) {
    if (testResult.coverage === undefined) {
      continue;
    }

    for (const coverage of Object.values(testResult.coverage)) {
      selectedSourceFiles.add(coverage.path);
    }
  }

  for (const sourcePath of selectedSourceFiles) {
    const fileResult = fileResults.get(sourcePath);

    for (const expression of fileResult.expressions) {
      const { location, sourcePath, testedPath } = expression;
      faults.push({
        sourcePath,
        testedPath,
        location,
        score: scoringFn(expression.stats),
      });
    }
  }

  return faults;
};

exports.localizeFaults = localizeFaults;

const simplifyPath = absoluteFilePath =>
  (0, _path.relative)(process.cwd(), absoluteFilePath);

const reportFaults = async (faults, scoringFn) => {
  const rankedFaults = faults
    .filter(fault => fault.score !== null)
    .sort((f1, f2) => f2.score - f1.score)
    .slice(0, 10);

  for (const fault of rankedFaults) {
    const lines = (await (0, _fs.readFile)(fault.sourcePath, 'utf8')).split('\n');
    console.log(
      `${simplifyPath(fault.sourcePath)}:${fault.location.start.line}:${
        fault.location.start.column
      }, ${_chalk.default.cyan(fault.score.toString())}`,
    );
    let l = fault.location.start.line - 1;
    let lineCount = 0;
    const maxLineCount = 3;

    while (l < fault.location.end.line - 1 && lineCount < maxLineCount) {
      console.log(_chalk.default.grey(lines[l++]));
      lineCount++;
    }

    const lastLine = lines[l++];
    console.log(_chalk.default.grey(lastLine));

    if (lineCount >= maxLineCount) {
      const spaces = lastLine.match(/^ */)[0];
      console.log(_chalk.default.grey(`${new Array(spaces.length + 1).join(' ')}...`));
    }

    console.log();
  }
};

const createPlugin = ({ scoringFn = _sbflDstar.default, faultFilePath }) => {
  return {
    on: {
      complete: async results => {
        const testResults = [...results.testResults.values()];
        const fileResults = gatherResults(testResults);
        const totalPassFailStats = (0, _localizationUtil.passFailStatsFromTests)(
          testResults,
        );
        const faults = localizeFaults(testResults, fileResults, expressionPassFailStats =>
          scoringFn(expressionPassFailStats, totalPassFailStats),
        );
        await reportFaults(faults, scoringFn);

        if (
          faultFilePath !== null &&
          faultFilePath !== undefined &&
          faultFilePath !== false
        ) {
          const resolvedFilePath = (() => {
            if (faultFilePath === true) {
              return './faults/faults.json';
            } else {
              return faultFilePath;
            }
          })();

          await (0, _recordFaults.recordFaults)(resolvedFilePath, faults);
        }
      },
    },
  };
};

exports.createPlugin = createPlugin;
var _default = createPlugin;
exports.default = _default;
//# sourceMappingURL=index.js.map
