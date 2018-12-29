import config from '@monorepo/config';
import chalk from 'chalk';
import gulp from 'gulp';

import { parallel } from './utils/gulp-wrappers.ts';
import copy from './copy.ts';
import transpile from './transpile.ts';
import logger from './utils/logger.ts';

const watch = async () => {
  // TODO: Never resolves :3 (on purpose but should find a better way)
  return gulp.watch(
    config.buildableSourceFileGlobs,
    {
      ignoreInitial: false,
      ignored: config.buildableIgnoreGlobs,
      events: 'all',
    },
    () => {
      logger.info(`Rerunning ${chalk.cyan('watch')}`);
      return parallel(copy, transpile)();
    },
  );
};

export default watch;
