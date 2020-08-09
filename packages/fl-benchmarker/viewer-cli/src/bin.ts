import yargs from 'yargs';

yargs.command('build')
  .options('results-dir', {
    alias: 'd',
    type: 'string',
    description: 'The directy where the benchmarker results are stored',
  });