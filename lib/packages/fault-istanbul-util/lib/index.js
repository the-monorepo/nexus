'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getTotalExecutedStatements = exports.readCoverageFile = exports.subtractCoverage = exports.diffBranchObjectCount = exports.diffExpressionObjectCount = exports.cloneCoverage = void 0;

var _fs = require('mz/fs');

const cloneCoverage = coverage => {
  if (Array.isArray(coverage)) {
    return coverage.map(cloneCoverage);
  } else if (typeof coverage === 'object') {
    const obj = {};

    for (const [key, value] of Object.entries(coverage)) {
      obj[key] = cloneCoverage(value);
    }

    return obj;
  } else {
    return coverage;
  }
};

exports.cloneCoverage = cloneCoverage;

const diffExpressionObjectCount = (from, amount) => {
  const diff = {};

  for (const key of Object.keys(from)) {
    diff[key] = from[key] - amount[key];
  }

  return diff;
};

exports.diffExpressionObjectCount = diffExpressionObjectCount;

const diffBranchObjectCount = (from, amount) => {
  const diff = {};

  for (const key of Object.keys(from)) {
    const fromBranch = from[key];
    const amountBranch = amount[key];
    const branch = new Array(fromBranch.length);

    for (let i = 0; i < branch.length; i++) {
      branch[i] = fromBranch[i] - amountBranch[i];
    }

    diff[key] = branch;
  }

  return diff;
};

exports.diffBranchObjectCount = diffBranchObjectCount;

const notZero = value => value !== 0;

const subtractCoverage = (from, amount) => {
  if (amount === undefined) {
    return cloneCoverage(from);
  }

  const diff = {};

  for (const [filePath, fileCoverage] of Object.entries(from)) {
    const beforeFileCoverage = amount[filePath];

    if (beforeFileCoverage === undefined) {
      diff[filePath] = cloneCoverage(fileCoverage);
      continue;
    }

    const fileDiff = {
      path: filePath,
      statementMap: fileCoverage.statementMap,
      fnMap: fileCoverage.fnMap,
      branchMap: fileCoverage.branchMap,
      s: diffExpressionObjectCount(fileCoverage.s, beforeFileCoverage.s),
      f: diffExpressionObjectCount(fileCoverage.f, beforeFileCoverage.f),
      b: diffBranchObjectCount(fileCoverage.b, beforeFileCoverage.b),
      _coverageSchema: fileCoverage._coverageSchema,
      hash: fileCoverage.hash,
    };
    const hasChanged =
      Object.values(fileDiff.s).some(notZero) ||
      Object.values(fileDiff.f).some(notZero) ||
      Object.values(fileDiff.b).some(arr => arr.some(notZero));

    if (hasChanged) {
      diff[filePath] = fileDiff;
    }
  }

  return diff;
};

exports.subtractCoverage = subtractCoverage;

const readCoverageFile = async (filePath = './coverage/coverage-final.json') => {
  const coverageText = await (0, _fs.readFile)(filePath, 'utf8');
  const coverage = JSON.parse(coverageText);
  return coverage;
};

exports.readCoverageFile = readCoverageFile;

const getTotalExecutedStatements = coverage => {
  let total = 0;

  for (const fileCoverage of Object.values(coverage)) {
    total += Object.values(fileCoverage.s).filter(value => value > 0).length;
  }

  return total;
};

exports.getTotalExecutedStatements = getTotalExecutedStatements;
//# sourceMappingURL=index.js.map
