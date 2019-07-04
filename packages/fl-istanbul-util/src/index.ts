export const cloneCoverage = coverage => {
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

export interface BCoverage {
  [s: string]: number[];
}

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

const notZero = value => value !== 0;

export interface FCoverage {
  [s: string]: number;
}

export interface SCoverage {
  [s: string]: number;
}
export interface ExpressionLocation {
  line: number;
  column: number;
}
export interface ExpressionCoverage {
  start: ExpressionLocation;
  end: ExpressionLocation;
}
export interface StatementMap {
  [s: string]: ExpressionCoverage;
}
export interface FunctionCoverage {
  name: string;
  decl: ExpressionCoverage;
  loc: ExpressionCoverage;
  line: number;
}
export interface FunctionMap {
  [s: string]: FunctionCoverage;
}
export interface Coverage {
  [s: string]: {
    path: string;
    statementMap: StatementMap;
    fnMap: FunctionMap;
    branchMap: any;
    s: SCoverage;
    f: FCoverage;
    b: BCoverage;
    _coverageSchema: string;
    hash: string;  
  }
}
export const subtractCoverage = (from: Coverage, amount: Coverage | undefined) => {
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
    } else {
      //console.log(filePath, fileDiff.s, beforeFileCoverage.s, fileCoverage.s)
    }
  }
  return diff;
};
