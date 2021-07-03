import { CoverageMapData } from 'istanbul-lib-coverage';

export const cloneCoverage = (coverage) => {
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

export const diffExpressionObjectCount = (from, amount) => {
  const diff = {};
  for (const key of Object.keys(from)) {
    diff[key] = from[key] - amount[key];
  }
  return diff;
};

export type BCoverage = {
  [s: string]: number[];
};

export const diffBranchObjectCount = (from: BCoverage, amount: BCoverage) => {
  const diff: BCoverage = {};

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

const notZero = (value) => value !== 0;

export type FCoverage = {
  [s: string]: number;
};

export type SCoverage = {
  [s: string]: number;
};

export type TextLocation = {
  line: number;
  column: number;
};

export type ExpressionLocation = {
  start: TextLocation;
  end: TextLocation;
};
export type StatementMap = {
  [s: string]: ExpressionLocation;
};
export type FunctionCoverage = {
  name: string;
  decl: ExpressionLocation;
  loc: ExpressionLocation;
  line: number;
};
export type FunctionMap = {
  [s: string]: FunctionCoverage;
};
export type Coverage = CoverageMapData;
export const subtractCoverage = (from: Coverage = {}, amount: Coverage | undefined) => {
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
      Object.values(fileDiff.b).some((arr) => arr.some(notZero));
    if (hasChanged) {
      diff[filePath] = fileDiff;
    }
  }
  return diff;
};

export const readCoverageFile = async (
  filePath = './coverage/coverage-final.json',
): Promise<Coverage> => {
  const coverage = await readJson(filePath);
  return coverage;
};

export const getTotalExecutedStatements = (coverage: Coverage): number => {
  let total = 0;

  for (const fileCoverage of Object.values(coverage)) {
    total += Object.values(fileCoverage.s).filter((value) => value > 0).length;
  }

  return total;
};
