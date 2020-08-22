import yargs from 'yargs';
import { build, watch } from './index';
import { join } from 'path';

yargs
  .command('watch', 'Watch the directory where the resutls', (commandConfigurator) => {
    commandConfigurator.option('port', {
      alias: 'p',
      type: 'number',
      default: 3004,
    });
  }, async (...args) => {
    await watch(...args);
  })
  .option('results-dir', {
    alias: 'd',
    type: 'string',
    description: 'The directory where the benchmarker results are stored',
    required: true,
    default: join(process.cwd(), 'fl-benchmarker-results'),
  })
  .command('build', 'Build a Webpack bundle of the benchmarker results UI', () => {}, async (...args) => {
    await build(...args);
  })
  .argv;
