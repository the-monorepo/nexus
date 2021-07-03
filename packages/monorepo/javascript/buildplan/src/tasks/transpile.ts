import chalk from 'chalk';

import logger from './utils/logger.ts';
import { createSrcDirSwapper } from './utils/path.ts';
import gulpPlumber from 'gulp-plumber';
import changed from 'gulp-changed';

import rename from 'gulp-rename';

import { packagesSrcCodeStream } from './utils/path.ts';
import { simplePipeLogger } from './utils/simplePipeLogger.ts';
import through from 'through2';

import gulp from 'gulp';
import { oldStreamToPromise } from './utils/gulp-wrappers.ts';

import Vinyl from 'vinyl';

const touch = () =>
  through.obj(function (file, _, cb) {
    if (file.stat) {
      file.stat.atime = file.stat.mtime = file.stat.ctime = new Date();
    }
    cb(null, file);
  });

const transpilePipes = async (stream, babelOptions, dir, logName = dir, chalkFn) => {
  const sourcemaps = await import('gulp-sourcemaps');
  const { transformAsync: bableTransform } = await import('@babel/core');
  const { default: applySourceMap } = await import('vinyl-sourcemaps-apply');

  const l = logger.child(chalk.blueBright('transpile'), chalkFn(logName));
  const renamePath = createSrcDirSwapper(dir);

  return stream
    .pipe(gulpPlumber({ errorHandler: (err) => l.exception(err) }))
    .pipe(
      changed('.', {
        transformPath: renamePath,
      }),
    )
    .pipe(simplePipeLogger(l))
    .pipe(sourcemaps.init())
    .pipe(
      through.obj(async function (file, _, done) {
        try {
          // Copied from https://github.com/babel/gulp-babel/blob/master/index.js
          const { code, map } = await bableTransform(file.contents.toString(), {
            ...babelOptions,
            filename: file.path,
            filenameRelative: file.relative,
            sourceMap: Boolean(file.sourceMap),
            sourceFileName: file.relative,
          });

          const newFile = new Vinyl({
            ...file,
            contents: Buffer.from(code),
          });

          map.file = newFile.relative;

          applySourceMap(newFile, map);

          try {
            done(null, newFile);
          } catch (doneErr) {
            console.error(doneErr);
          }
        } catch (err) {
          done(err);
        }
      }),
    )
    .pipe(
      rename((filePath) => {
        return {
          ...filePath,
          dirname: renamePath(filePath.dirname),
        };
      }),
    )
    .pipe(sourcemaps.mapSources((filePath) => filePath.replace(/.*\/src\//g, '../src/')))
    .pipe(sourcemaps.write('.', undefined))
    .pipe(touch());
};

const transpile = async () => {
  const stream = packagesSrcCodeStream();

  const baseEnv = process.env.NODE_ENV ?? 'development';

  const streams = await Promise.all([
    transpilePipes(
      stream,
      {
        envName: baseEnv,
      },
      'commonjs',
      'cjs',
      chalk.rgb(200, 255, 100),
    ),
    transpilePipes(
      stream,
      {
        envName: `${baseEnv}-esm`,
      },
      'esm',
      undefined,
      chalk.rgb(255, 200, 100),
    ),
  ]);

  return await Promise.all(
    streams.map((aStream) => aStream.pipe(gulp.dest('.'))).map(oldStreamToPromise),
  );
};

export default transpile;
