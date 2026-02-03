import gulp from 'gulp';
import changed from 'gulp-changed';
import rename from 'gulp-rename';

import chalk from 'chalk';

import { oldStreamToPromise } from './utils/gulp-wrappers.ts';

import logger from './utils/logger.ts';
import { createSrcDirSwapper, packagesSrcAssetStream } from './utils/path.ts';
import { simplePipeLogger } from './utils/simplePipeLogger.ts';

const copyPipes = (stream, l, dir) => {
  const renamePath = createSrcDirSwapper(dir);
  return stream
    .pipe(changed('.', { transformPath: renamePath }))
    .pipe(simplePipeLogger(l))
    .pipe(
      rename((filePath) => {
        filePath.dirname = renamePath(filePath.dirname);
        return filePath;
      }),
    )
    .pipe(gulp.dest('.'));
};

const copy = async () => {
  const stream = packagesSrcAssetStream();

  const libLogger = logger.child(
    chalk.yellowBright('copy'),
    chalk.rgb(200, 255, 100)('lib'),
  );
  const esmLoger = logger.child(
    chalk.yellowBright('copy'),
    chalk.rgb(255, 200, 100)('esm'),
  );

  const streams = [
    copyPipes(stream, libLogger, 'commonjs'),
    copyPipes(stream, esmLoger, 'esm'),
  ];

  return Promise.all(
    streams.map((aStream) => aStream.pipe(gulp.dest('.'))).map(oldStreamToPromise),
  );
};

export default copy;
