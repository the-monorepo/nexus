import chalk from 'chalk';
import { simplePipeLogger } from '../utils/simplePipeLogger';

import logger from '../utils/logger';

const prettierPipes = async (stream) => {
  const { default: prettier } = await import('gulp-prettier');
  const l = logger.child(chalk.magentaBright('prettier'));
  return stream.pipe(simplePipeLogger(l)).pipe(prettier());
};

const lintPipes = async (stream, lintOptions) => {
  const { default: eslint } = await import('gulp-eslint');

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
