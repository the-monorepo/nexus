import { submitTestResult } from 'fl-addon-core';
import { createHash } from 'crypto';
import Mocha from 'mocha';
const { 
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_BEGIN,
  EVENT_TEST_END,
} = (Mocha.Runner as any).constants;
const COVERAGE_KEY = '__coverage__';

const cloneCoverage = (coverage) => {
  if (Array.isArray(coverage)) {
    return coverage.map(cloneCoverage);
  } else if(typeof coverage === 'object') {
    const obj = {};
    for(const [key, value] of Object.entries(coverage)) {
      obj[key] = cloneCoverage(value);
    }
    return obj;
  } else {
    return coverage;
  }
}

const diffExpressionObjectCount = (before, total) => {
  const diff = {};
  for(const key of Object.keys(before)) {
    diff[key] = total[key] - before[key];
  }
  return diff;
}

type BCoverage = {
  [s: string]: number[]
};

const diffBranchObjectCount = (before: BCoverage, total: BCoverage) => {
  const diff: BCoverage = {};

  for(const key of Object.keys(before)) {
    const beforeBranch = before[key];
    const totalBranch = total[key];

    const branch = new Array(beforeBranch.length);
    for(let i = 0; i < branch.length; i++) {
      branch[i] = totalBranch[i] - beforeBranch[i];
    }
    diff[key] = branch;
  }

  return diff;
} 

const notZero = (value) => value !== 0;

type FCoverage = {
  [s: string]: number
};

type SCoverage = {
  [s: string]: number
};
type ExpressionLocation = {
  line: number,
  column: number
}
type ExpressionCoverage = {
  start: ExpressionLocation,
  end: ExpressionLocation
}
type StatementMap = {
  [s: string]: ExpressionCoverage,
}
type FunctionCoverage = {
  name: string,
  decl: ExpressionCoverage,
  loc: ExpressionCoverage,
  line: number
}
type FunctionMap = {
  [s: string]: FunctionCoverage
};
type Coverage = {
  path: string,
  statementMap: StatementMap,
  fnMap: FunctionMap,
  branchMap: any,
  s: SCoverage,
  f: FCoverage,
  b: BCoverage,
  _coverageSchema: string,
  hash: string,
}
const getSingleTestCoverage = (before: Coverage | undefined, total: Coverage) => {
  if (before === undefined) {
    return cloneCoverage(total);
  }
  const diff = {};
  for(const [filePath, fileCoverage] of Object.entries(total)) {
    const beforeFileCoverage = before[filePath];
    if (beforeFileCoverage === undefined) {
      diff[filePath] = cloneCoverage(fileCoverage);
      continue;
    }

    const fileDiff = {
      path: filePath,
      statementMap: fileCoverage.statementMap,
      fnMap: fileCoverage.fnMap,
      branchMap: fileCoverage.branchMap,
      s: diffExpressionObjectCount(beforeFileCoverage.s, fileCoverage.s),
      f: diffExpressionObjectCount(beforeFileCoverage.f, fileCoverage.f),
      b: diffBranchObjectCount(beforeFileCoverage.b, fileCoverage.b),
      _coverageSchema: fileCoverage._coverageSchema,
      hash: fileCoverage.hash,
    }


    const hasChanged = Object.values(fileDiff.s).some(notZero) || Object.values(fileDiff.f).some(notZero) || Object.values(fileDiff.b).some(arr => arr.some(notZero));
    if(hasChanged) {
      diff[filePath] = fileDiff;
    }
  }
  return diff;
}

const commonTestHandle = (submitHandle) => {
  return async (test, err) => {
    const coverage = getSingleTestCoverage(beforeTestCoverage, global[COVERAGE_KEY]);
    const hash = createHash('sha1')
      .update(test!.body)
      .digest('base64');
    const duration = test.duration! * 1000;
    const file = test.file!;
    const fullTitle = test.fullTitle();
    await submitHandle({ hash, duration, file, fullTitle, coverage }, test, err);
  }
}

let beforeTestCoverage: Coverage | undefined = undefined;
export class IPCReporter {
  constructor(runner) {
    runner.on(EVENT_TEST_PASS, commonTestHandle(async (testData) => {
      await submitTestResult({
        ...testData,
        passed: true,
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