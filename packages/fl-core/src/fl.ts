import { TestResult } from 'fl-addon-core';
const dStar = (codeElementTestStateCounts, totalTestStateCounts, e = 2) => {
  return (
    Math.pow(codeElementTestStateCounts.failed, e) /
    (codeElementTestStateCounts.passed +
      (totalTestStateCounts.failed - codeElementTestStateCounts.failed))
  );
};

const statementStr = (filePath, { start, end }) => {
  return `${filePath}|${start.line},${start.column}|${end.line},${end.column}`;
};

export const gatherResults = (testResults: TestResult[]) => {
  const statementToResults = new Map();
  for (const testResult of testResults) {
    const fileTests = testResult.coverage;
    if (fileTests === undefined) {
      continue;
    }
    for (const [filePath, fileCoverage] of Object.entries(fileTests) as any) {
      const statementMap = fileCoverage.statementMap;

      for (const statementKey of Object.keys(statementMap)) {
        const executionCount = fileCoverage.s[statementKey];
        if (executionCount === 0) {
          continue;
        }
        const statementCoverage = statementMap[statementKey];
        const hash = statementStr(filePath, statementCoverage);

        const results = (() => {
          if (statementToResults.has(hash)) {
            return statementToResults.get(hash);
          } else {
            const passFailCounts = { passed: 0, failed: 0 };
            const newResult = {
              location: statementCoverage,
              stateCounts: passFailCounts,
              file: filePath,
              sourceFile: fileCoverage.path,
            };
            statementToResults.set(hash, newResult);
            return newResult;
          }
        })();
        results.stateCounts[testResult.passed ? 'passed' : 'failed']++;
      }
    }
  }
  return statementToResults;
};

export const localiseFaults = (suiteResult: TestResult[]) => {
  const statementKeyToStateCounts = gatherResults(suiteResult);
  const stateCounts = { passed: 0, failed: 0 };

  for (const testResult of suiteResult) {
    stateCounts[testResult.passed ? 'passed' : 'failed']++;
  }

  const results = [...statementKeyToStateCounts.entries()]
    .map(([statementKey, statementStateCounts]) => {
      // console.log(statementStateCounts.stateCounts, stateCounts, statementKey);
      return {
        location: statementStateCounts.location,
        stateCounts: statementStateCounts.stateCounts,
        file: statementStateCounts.file,
        sourceFile: statementStateCounts.sourceFile,
        rank: dStar(statementStateCounts.stateCounts, stateCounts),
      };
    })
    .filter(fault => fault.rank > 0)
    .sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0));
  return results;
};

export const localiseFaultsFromSuiteResults = (
  suiteResults: Map<string, TestResult[]>,
) => {
  const failedSuites = Array.from(suiteResults.values()).filter(suiteResult =>
    suiteResult.some(testResult => !testResult.passed),
  );
  const faults = failedSuites.map(localiseFaults);
  return faults;
};
