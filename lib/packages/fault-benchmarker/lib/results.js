'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.run = void 0;

var _fs = require('mz/fs');

var _globby = _interopRequireDefault(require('globby'));

var _path = require('path');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const run = async () => {
  const projectDirs = await (0, _globby.default)('./projects/*', {
    expandDirectories: false,
    onlyDirectories: true,
  });
  const projectResults = [];

  for (const projectDir of projectDirs) {
    const packageJson = require((0, _path.resolve)(projectDir, 'package.json'));

    projectResults.push({
      name: packageJson.name,
      results: require((0, _path.resolve)(projectDir, 'fault-results.json')),
    });
  }

  const algorithmNames = new Set();

  for (const projectResult of projectResults) {
    for (const algorithmName of Object.keys(projectResult.results)) {
      algorithmNames.add(algorithmName);
    }
  }

  const initialAverageResult = [...algorithmNames].reduce((obj, algorithmName) => {
    obj[algorithmName] = 0;
    return obj;
  }, {});
  const averageResults = projectResults.reduce((currentSum, projectResult) => {
    for (const algorithmName of Object.keys(projectResult.results)) {
      currentSum[algorithmName] += projectResult.results[algorithmName];
    }

    return currentSum;
  }, initialAverageResult);

  for (const algorithmName of Object.keys(averageResults)) {
    averageResults[algorithmName] /= projectResults.length;
  }

  const finalResults = {
    average: averageResults,
    projects: projectResults,
  };
  await (0, _fs.writeFile)(
    './benchmark-results.json',
    JSON.stringify(finalResults, undefined, 2),
    'utf8',
  );
};

exports.run = run;
run().catch(console.error);
//# sourceMappingURL=results.js.map
