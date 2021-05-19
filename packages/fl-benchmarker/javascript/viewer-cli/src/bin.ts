import yargs from 'yargs';
import { build, watch } from './index.ts';

const createModeOptionArgs = (defaultEnv: string) =>
  [
    'mode',
    {
      alias: 'm',
      type: 'string',
      default: defaultEnv,
    },
  ] as const;

yargs
  .strict()
  .showHelpOnFail(true)
  .option('resultsDir', {
    alias: 'd',
    type: 'string',
    description: 'The directory where the benchmarker results are stored',
    required: true,
    default: './fl-benchmarker-results',
  })
  .command(
    'serve',
    'Watch the directory where the benchmark results are stored and serve them in a browser app',
    (commandConfigurator) =>
      commandConfigurator
        .option('port', {
          alias: 'p',
          type: 'number',
          default: 3004,
        })
        .option(...createModeOptionArgs('development')),
    async (args) => {
      await watch(args);
    },
  )
  .command(
    'build',
    'Build a Webpack bundle of the benchmarker results UI',
    (commandConfigurator) =>
      commandConfigurator
        .option('outputDir', {
          alias: 'o',
          type: 'string',
          description: 'The output directory of the created bundle',
          required: true,
          default: './dist',
        })
        .option(...createModeOptionArgs('production')),
    async (...args) => {
      await build(...args);
    },
  )
  .demandCommand().argv;
