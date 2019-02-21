/**
 * Inspiration for this file taken from https://github.com/babel/babel/blob/master/Gulpfile.js
 */
require('source-map-support/register');
const { join, sep, relative } = require('path');

const del = require('del');
const chalk = require('chalk');

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const changed = require('gulp-changed');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const prettier = require('gulp-prettier');
const eslint = require('gulp-eslint');
const staged = require('gulp-staged');

const through = require('through2');

const packagesDirName = 'packages';

function swapSrcWith(srcPath, newDirName) {
  // Should look like /packages/<package-name>/src/<rest-of-the-path>
  srcPath = relative(__dirname, srcPath);
  const parts = srcPath.split(sep);
  // Swap out src for the new dir name
  parts[2] = newDirName;
  return join(__dirname, ...parts);
}

function errorLogger(l) {
  return plumber({
    errorHandler(err) {
      l.error(err);
    },
  });
}

/**
 * @param srcPath An absolute path
 */
function swapSrcWithLib(srcPath) {
  return swapSrcWith(srcPath, 'lib');
}

function packagesGlobFromPackagesDirName(dirName) {
  return `./${dirName}/*`;
}

function packageSubDirGlob(dirName, folderName) {
  return `./${dirName}/*/${folderName}/**/*`;
}

function srcTranspiledGlob(dirName, folderName) {
  return `${packageSubDirGlob(dirName, folderName)}.${transpiledExtensions}`;
}

function mockGlob(dirName, folderName) {
  return `${packageSubDirGlob(dirName, folderName)}/__mocks__/*`;
}

const transpiledExtensions = '{js,jsx,ts,tsx,html,css}';

function globSrcMiscFromPackagesDirName(dirName) {
  return [
    packageSubDirGlob(dirName, 'src'),
    `!${srcTranspiledGlob(dirName, 'src')}`,
    `!${mockGlob(dirName, 'src')}`,
  ];
}

function globSrcCodeFromPackagesDirName(dirName) {
  return [srcTranspiledGlob(dirName, 'src'), `!${mockGlob(dirName, 'src')}`];
}

function globBuildOutputFromPackagesDirName(dirName) {
  return [
    packageSubDirGlob(dirName, 'lib'),
    packageSubDirGlob(dirName, 'esm'),
    packageSubDirGlob(dirName, 'dist'),
  ];
}

function sourceGlobFromPackagesDirName(dirName) {
  return join(packagesGlobFromPackagesDirName(dirName), 'src/**/*.{js,jsx,ts,tsx}');
}

const pshawLogger = require('build-pshaw-logger');
const logger = pshawLogger.logger().add(pshawLogger.consoleTransport());

function packagesSrcMiscStream(options) {
  return gulp.src(globSrcMiscFromPackagesDirName(packagesDirName), { base: '.', ...options });
}

function packagesSrcCodeStream(options) {
  return gulp.src(globSrcCodeFromPackagesDirName(packagesDirName), { base: '.', ...options });
}

function simplePipeLogger(l, verb) {
  return through.obj(function(file, enc, callback) {
    l.info(`${verb} '${chalk.cyan(file.relative)}'`);
    callback(null, file);
  });
}

function clean() {
  return del(globBuildOutputFromPackagesDirName(packagesDirName));
}
gulp.task('clean', clean);

function copy() {
  const l = logger.tag(chalk.yellow('copy'));
  return packagesSrcMiscStream()
    .pipe(changed('.', { transformPath: swapSrcWithLib }))
    .pipe(simplePipeLogger(l, 'Copying'))
    .pipe(
      rename(filePath => {
        filePath.dirname = join(filePath.dirname, '../lib');
        return filePath;
      }),
    )
    .pipe(gulp.dest('.'));
}

function transpile() {
  const l = logger.tag(chalk.blue('transpile'));
  return packagesSrcCodeStream()
    .pipe(errorLogger(l))
    .pipe(changed('.', { extension: '.js', transformPath: swapSrcWithLib }))
    .pipe(simplePipeLogger(l, 'Transpiling'))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(
      rename(filePath => {
        filePath.dirname = join(filePath.dirname, '../lib');
        return filePath;
      }),
    )
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('.'));
}

function printFriendlyAbsoluteDir(dir) {
  if (relative(dir, __dirname) === '') {
    return '.';
  }
  return relative(join(__dirname), dir);
}

gulp.task('transpile', transpile);

async function writeme() {
  const { writeReadmeFromPackageDir } = require('@pshaw/writeme');
  const l = logger.tag(chalk.green('writeme'));
  await writeReadmeFromPackageDir(__dirname, {
    before: {
      genReadme: async ({ packageDir }) => {
        l.info(
          `Generating readme for '${chalk.cyan(printFriendlyAbsoluteDir(packageDir))}'`,
        );
      },
    },
    after: {
      readConfig: async ({ config, configPath }) => {
        if (!config) {
          l.warn(`Missing '${chalk.cyan(printFriendlyAbsoluteDir(configPath))}'`);
        }
      },
    },
    on: {
      error: async err => {
        l.error(err.stack);
      },
    },
  });
}
gulp.task('writeme', writeme);

const build = gulp.series(copy, transpile, writeme);
gulp.task('build', build);

function watch() {
  return gulp.watch(
    [sourceGlobFromPackagesDirName(packagesDirName)],
    { ignoreInitial: false },
    build,
  );
}
gulp.task('watch', watch);

gulp.task('default', build);

function gulpPrettier() {
  return prettier();
}

function prettierPipes(stream) {
  const l = logger.tag(chalk.magentaBright('prettier'));
  return stream.pipe(simplePipeLogger(l, 'Formatting'))
    .pipe(gulpPrettier());
}

function formatPrettier() {
  return prettierPipes(
    packagesSrcCodeStream()
  ).pipe(gulp.dest('.'));
}
gulp.task('format:prettier', formatPrettier);

function formatStagedPrettier() {
  return prettierPipes(
    packagesSrcCodeStream()
      .pipe(staged())
  ).pipe(gulp.dest('.'));
}
gulp.task('format-staged:staged', formatStagedPrettier);

function gulpLint(options) {
  return gulpTslint({
    formatter: 'stylish',
    tslint,
    ...options,
  });
}

function messageLoggingFn(message, l) {
  switch(message.severity) {
    case 1:
      return l.warn;
    case 2:
      return l.error;
    default:
      return l.info;
  }
}

function eslintReporter(l) {
  return (result) => {
    l.info(JSON.stringify(message, undefined, 2));
    for (const message of result.messages) {    
      const logFn = messageLoggingFn(message, l);
      logFn(message.message);
    }
  }  
}

function lintPipes(stream, lintOptions) {
  const l = logger.tag(chalk.magenta('eslint'));
  return stream
    .pipe(simplePipeLogger(l, 'Formatting'))
    .pipe(eslint(lintOptions))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

function formatStagedLint() {
  return lintPipes(
    packagesSrcCodeStream()
      .pipe(staged()),
      { fix: true }
  );
}
formatStagedLint.description =
  'Corrects any automatically fixable linter warnings or errors. Note that this command will ' +
  'overwrite files without creating a backup.';
gulp.task('format-staged:lint', formatStagedLint);

function formatPipes(stream) {
  return prettierPipes(
    lintPipes(
      stream,
      { fix: true }
    )
  );
}

function format() {
  return formatPipes(packagesSrcCodeStream())
    .pipe(gulp.dest('.'));
}
gulp.task('format', format);

function formatStaged() {
  return formatPipes(
    packagesSrcCodeStream()
      .pipe(staged())
  ).pipe(gulp.dest('.'));
}
gulp.task('format-staged', formatStaged);

function checkTypes() {
  const stream = packagesSrcCodeStream();
  return stream.pipe(tsProject(gulpTypescript.reporter.fullReporter()));
}
checkTypes.description =
  'Runs the TypeScript type checker on the codebase, displaying the output. This will display any ' +
  'serious errors in the code, such as invalid syntax or the use of incorrect types.';
gulp.task('checker:types', checkTypes);
