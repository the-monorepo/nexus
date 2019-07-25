'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.run = exports.getProjectPaths = exports.calculateExamScore = exports.faultToKey = void 0;

require('source-map-support/register');

var _addonSbfl = require('@fault/addon-sbfl');

var _recordFaults = require('@fault/record-faults');

var _logger = require('@pshaw/logger');

var _fs = require('mz/fs');

var _fs2 = require('fs');

var _istanbulUtil = require('@fault/istanbul-util');

var flRunner = _interopRequireWildcard(require('@fault/runner'));

var _path = require('path');

var _globby = _interopRequireDefault(require('globby'));

var _sbflDstar = require('@fault/sbfl-dstar');

var _sbflTarantula = require('@fault/sbfl-tarantula');

var _sbflOchiai = require('@fault/sbfl-ochiai');

var _sbflBarinel = require('@fault/sbfl-barinel');

var _sbflOp = require('@fault/sbfl-op2');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};
    if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          var desc =
            Object.defineProperty && Object.getOwnPropertyDescriptor
              ? Object.getOwnPropertyDescriptor(obj, key)
              : {};
          if (desc.get || desc.set) {
            Object.defineProperty(newObj, key, desc);
          } else {
            newObj[key] = obj[key];
          }
        }
      }
    }
    newObj.default = obj;
    return newObj;
  }
}

const faultToKey = (projectDir, fault) => {
  return `${(0, _path.resolve)(projectDir, fault.sourcePath)}:${
    fault.location.start.line
  }:${fault.location.start.column}`;
};

exports.faultToKey = faultToKey;

const calculateExamScore = (
  projectDir,
  actualFaults,
  expectedFaults,
  totalExecutableStatements,
) => {
  const expectedFaultMap = new Map();

  for (const fault of expectedFaults) {
    expectedFaultMap.set(faultToKey(projectDir, fault), fault);
  }

  let sum = 0;
  let linesInspected = 1; // The first fault will still need to be counted as 1 line so start with 1

  for (const actualFault of actualFaults) {
    const key = faultToKey(projectDir, actualFault);
    const expectedFault = expectedFaultMap.get(key);

    if (expectedFault !== undefined) {
      sum += linesInspected;
      expectedFaultMap.delete(key);
    } else {
      linesInspected++;
    }
  }

  return sum / expectedFaults.length / totalExecutableStatements;
};

exports.calculateExamScore = calculateExamScore;

const getProjectPaths = async (path = './projects/*') => {
  return await (0, _globby.default)(path, {
    onlyDirectories: true,
    expandDirectories: false,
  });
};

exports.getProjectPaths = getProjectPaths;
const sbflAlgorithms = [
  {
    name: 'dstar-2',
    scoringFn: (a, b) => (0, _sbflDstar.dStar)(a, b, 1),
  },
  {
    name: 'dstar-2',
    scoringFn: _sbflDstar.dStar,
  },
  {
    name: 'dstar-3',
    scoringFn: (a, b) => (0, _sbflDstar.dStar)(a, b, 3),
  },
  {
    name: 'dstar-4',
    scoringFn: (a, b) => (0, _sbflDstar.dStar)(a, b, 4),
  },
  {
    name: 'dstar-5',
    scoringFn: (a, b) => (0, _sbflDstar.dStar)(a, b, 5),
  },
  {
    name: 'ochiai',
    scoringFn: _sbflOchiai.ochiai,
  },
  {
    name: 'tarantula',
    scoringFn: _sbflTarantula.tarantula,
  },
  {
    name: 'barinel',
    scoringFn: _sbflBarinel.barinel,
  },
  {
    name: 'op2',
    scoringFn: _sbflOp.op2,
  },
];
const log = (0, _logger.logger)().add(
  (0, _logger.consoleTransport)({
    level: 'verbose',
  }),
);

const faultFilePath = (projectDir, sbflModuleFolderName) => {
  const faultPath = (0, _path.resolve)(
    projectDir,
    'faults',
    sbflModuleFolderName,
    'faults.json',
  );
  return faultPath;
};

const run = async () => {
  const projectDirs = await getProjectPaths(
    process.argv.length <= 2 ? undefined : process.argv.slice(2),
  );

  const runOnProject = async projectDir => {
    log.verbose(`Starting ${projectDir}...`);
    const benchmarkConfigPath = (0, _path.resolve)(projectDir, 'benchmark.config.js');
    const benchmarkConfigExists = (0, _fs2.existsSync)(benchmarkConfigPath);
    const {
      setupFiles = [(0, _path.resolve)(__dirname, 'babel')],
      testMatch = (0, _path.resolve)(projectDir, '**/*.test.{js,jsx,ts,tsx}'),
    } = benchmarkConfigExists ? require(benchmarkConfigPath) : {};
    const expectedFaults = (0, _recordFaults.convertFileFaultDataToFaults)(
      require((0, _path.resolve)(projectDir, 'expected-faults.json')),
    );
    const projectOutput = {};
    log.verbose(`Running SBFL algorithms on ${projectDir}`);
    const sbflAddons = sbflAlgorithms.map(({ scoringFn, name }) => {
      const sbflAddon = (0, _addonSbfl.createPlugin)({
        scoringFn: scoringFn,
        faultFilePath: faultFilePath(projectDir, name),
      });
      return sbflAddon;
    });
    await flRunner.run({
      tester: '@fault/tester-mocha',
      testMatch: testMatch,
      addons: sbflAddons,
      setupFiles,
      cwd: projectDir,
    });
    const coverage = await (0, _istanbulUtil.readCoverageFile)(
      (0, _path.resolve)(projectDir, 'coverage/coverage-final.json'),
    );

    for (const { name } of sbflAlgorithms) {
      const actualFaults = (0, _recordFaults.convertFileFaultDataToFaults)(
        require(faultFilePath(projectDir, name)),
      );
      const totalExecutableStatements = (0, _istanbulUtil.getTotalExecutedStatements)(
        coverage,
      );
      const examScore = calculateExamScore(
        projectDir,
        actualFaults,
        expectedFaults,
        totalExecutableStatements,
      );
      projectOutput[name] = examScore;
    }

    const faultResultsPath = (0, _path.resolve)(projectDir, 'fault-results.json');
    console.log(projectOutput);
    await (0, _fs.writeFile)(
      faultResultsPath,
      JSON.stringify(projectOutput, undefined, 2),
    );
  };

  for (const projectDir of projectDirs) {
    await runOnProject((0, _path.resolve)(__dirname, '..', projectDir));
  }
};

exports.run = run;
run().catch(console.error);
//# sourceMappingURL=index.js.map
