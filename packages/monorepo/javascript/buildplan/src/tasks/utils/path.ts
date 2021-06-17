import { sep, relative, join } from 'path';
import config from '@monorepo/config';
import gulp from 'gulp';
import getStagableFiles from 'lint-staged/lib/getStagedFiles.js';
import filter from 'stream-filter-glob';

const swapSrcWith = (srcPath, newDirName) => {
  // Should look like /packages/<package-name>/javascript/src/<rest-of-the-path>
  srcPath = relative(process.cwd(), srcPath);
  const parts = srcPath.split(sep);
  // Swap out src for the new dir name
  parts[4] = newDirName;
  const resultingPath = join(...parts);
  return resultingPath;
};

export const createSrcDirSwapper = (dir) => {
  return (srcPath) => swapSrcWith(srcPath, dir);
};

export const packagesSrcAssetStream = (options?) => {
  return gulp.src(
    [
      ...config.buildableSourceAssetGlobs,
      ...config.buildableIgnoreGlobs.map((glob) => `!${glob}`),
    ],
    {
      base: '.',
      nodir: true,
      ...options,
    },
  );
};

export const packagesSrcCodeStream = (options?) => {
  return gulp.src(
    [
      ...config.buildableSourceCodeGlobs,
      ...config.buildableIgnoreGlobs.map((glob) => `!${glob}`),
    ],
    {
      base: `.`,
      nodir: true,
      ...options,
    },
  );
};

export const packagesSrcCodeStagedStream = async (options?) => {
  return gulp
    .src(await getStagableFiles(), {
      base: `.`,
      nodir: true,
      ...options,
    })
    .pipe(filter(config.buildableSourceCodeGlobs, config.buildableIgnoreGlobs));
};
