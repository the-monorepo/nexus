import config from '@monorepo/config';
import transpile from './transpile.ts';

const flIgnoreGlob =
  'packages/faultjs/javascript/{fault-messages,fault-tester-mocha,fault-addon-mutation-localization,fault-istanbul-util,fault-runner,fault-addon-hook-schema,hook-schema,fault-record-faults,fault-addon-istanbul,fault-types}/**/*';

const getFaultLocalizationAddon = async () => {
  switch (config.extra.flMode) {
    default:
    case 'sbfl': {
      const { default: createAddon } = await import('@fault/addon-sbfl');
      const { default: dstar } = await import('@fault/sbfl-dstar');
      return createAddon({
        scoringFn: dstar,
        faultFilePath: true,
        console: true,
      });
    }
    case 'mbfl': {
      const { default: createAddon } = await import('@fault/addon-mutation-localization');
      return createAddon({
        babelOptions: {
          plugins: ['jsx', 'typescript', 'exportDefaultFrom', 'classProperties'],
          sourceType: 'module',
        },
        ignoreGlob: flIgnoreGlob,
        mapToIstanbul: true,
        onMutation: transpile,
      });
    }
  }
};

const test = async () => {
  const runner = await import('@fault/runner');
  const flAddon = await getFaultLocalizationAddon();
  const { default: minimist } = await import('minimist');

  const args = minimist(process.argv.slice(3));

  const { _: paths } = args;

  const passed = await runner.run({
    tester: '@fault/tester-mocha',
    testMatch:
      paths.length >= 1
        ? paths
        : [
            ...config.testableGlobs,
            ...config.testableIgnoreGlobs.map((glob) => `!${glob}`),
          ],
    addons: [flAddon],
    processOptions: {
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    },
    setupFiles: ['./test/helpers/globals.js'],
    testerOptions: {
      sandbox: true,
    },
    timeout: 20000,
  });
  if (!passed) {
    process.exitCode = 1;
  }
};

export default test;
