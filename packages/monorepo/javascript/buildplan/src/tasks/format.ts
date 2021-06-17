import { formatPipes } from './pipes/formatPipes.ts';
import gulp from 'gulp';
import config from '@monorepo/config';

const formatStream = (options?) =>
  gulp.src(
    [
      ...config.formatableGlobs,
      ...config.formatableIgnoreGlobs.map((glob) => `!${glob}`),
    ],
    {
      base: '.',
      nodir: true,
      ...options,
    },
  );

const format = async () => {
  return (await formatPipes(formatStream())).pipe(gulp.dest('.'));
};

export default format;
