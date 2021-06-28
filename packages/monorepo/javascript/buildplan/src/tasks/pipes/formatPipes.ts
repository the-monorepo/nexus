import chalk from 'chalk';
import { simplePipeLogger } from '../utils/simplePipeLogger';

import logger from '../utils/logger';

import prettier from 'gulp-prettier';

import eslint from 'gulp-eslint';

const prettierPipes = async (stream) => {
  const l = logger.child(chalk.magentaBright('prettier'));
  return stream.pipe(simplePipeLogger(l)).pipe(prettier());
};

const lintPipes = async (stream, lintOptions) => {
  const l = logger.child(chalk.magentaBright('eslint'));
  return (
    stream
      .pipe(simplePipeLogger(l))
      .pipe(eslint(lintOptions))
      .pipe(eslint.format('unix'))
      // TODO: Need to halt build process/throw error
      .pipe(eslint.failAfterError())
  );
};

export const formatPipes = async (stream) => {
  return await prettierPipes(await lintPipes(stream, { fix: true }));
};
