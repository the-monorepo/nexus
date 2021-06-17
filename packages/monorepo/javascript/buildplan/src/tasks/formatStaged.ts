import gulp from 'gulp';
import config from '@monorepo/config';
import getStagableFiles from 'lint-staged/lib/getStagedFiles.js';
import filter from 'gulp-filter';

import { formatPipes } from './pipes/formatPipes.ts';

const formatStagedStream = async () => {
  const { Readable } = await import('stream');
  const stagedPaths = await getStagableFiles();
  const stagedStream =
    stagedPaths.length > 0
      ? gulp.src(stagedPaths, {
          base: '.',
          nodir: true,
        })
      : Readable.from([]);
  return stagedStream.pipe(filter(config.formatableGlobs, config.formatableIgnoreGlobs));
};

const formatStaged = async () => {
  return (await formatPipes(await formatStagedStream())).pipe(gulp.dest('.'));
};

export default formatStaged;
