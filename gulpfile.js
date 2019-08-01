require('source-map-support/register');
/**
 * Inspiration for this file taken from https://github.com/babel/babel/blob/master/Gulpfile.js
 */
const { join, sep, relative } = require('path');

const chalk = require('chalk');

const gulp = require('gulp');
const changed = require('gulp-changed');
const staged = require('gulp-staged');
const rename = require('gulp-rename');

const spawn = require('cross-spawn');

const through = require('through2');

const PluginError = require('plugin-error');

const packagesDirName = 'packages';
const buildPackagesDirName = 'build-packages';

function swapSrcWith(srcPath, newDirName) {
  // Should look like /packages/<package-name>/src/<rest-of-the-path>
  srcPath = relative(__dirname, srcPath);
  const parts = srcPath.split(sep);
  // Swap out src for the new dir name
  parts[2] = newDirName;
  const resultingPath = join(__dirname, ...parts);
  return resultingPath;
}

function createSrcDirSwapper(dir) {
  return srcPath => swapSrcWith(srcPath, dir);
}

function packagesGlobFromPackagesDirName(dirName) {
  return `./${dirName}/*`;
}

function packageSubDirGlob(dirName, folderName) {
  return `./${dirName}/*/${folderName}/**/*`;
}

const transpiledExtensions = '{js,jsx,ts,tsx}';

function srcTranspiledGlob(dirName, folderName) {
  return `${packageSubDirGlob(dirName, folderName)}.${transpiledExtensions}`;
}

function mockGlob(dirName, folderName) {
  return `${packageSubDirGlob(dirName, folderName)}/__mocks__/*`;
}

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
  return `${packagesGlobFromPackagesDirName(dirName)}/src/**`;
}

const pshawLogger = require('build-pshaw-logger');
const logger = pshawLogger.logger().add(pshawLogger.consoleTransport());

function packagesSrcMiscStream(options) {
  return gulp.src(globSrcMiscFromPackagesDirName(packagesDirName), {
    base: '.',
    ...options,
  });
}

function packagesSrcCodeStream(options) {
  return gulp.src(globSrcCodeFromPackagesDirName(packagesDirName), {
    base: `.`,
    ...options,
  });
}

function packagesSrcCodeWithTsDefinitionsStream(options) {
  return gulp.src(globSrcCodeFromPackagesDirName(packagesDirName).concat('**/*.d.ts'), {
    base: `.`,
    ...options,
  });
}

function codeStream(options) {
  return gulp.src(
    [
      '**/*.{js,jsx,ts,tsx}',
      '!**/node_modules/**',
      '!coverage/**',
      '!{build-packages,packages}/*/{dist,lib,esm,coverage}/**',
      '!packages/fault-benchmarker/projects/**',
    ],
    {
      base: '.',
      ...options,
    },
  );
}

function simplePipeLogger(l, verb) {
  return through.obj(function(file, enc, callback) {
    l.info(`${verb} '${chalk.cyan(file.relative)}'`);
    callback(null, file);
  });
}

async function clean() {
  const del = require('del');
  await del(globBuildOutputFromPackagesDirName(packagesDirName));
  await del(globBuildOutputFromPackagesDirName(buildPackagesDirName));
  await del(['./README.md', './{build-packages,packages}/*/README.md']);
  await del(['./packages/fault-benchmarker/projects/*/{faults,coverage,fault-results.json}']);
  await del(['./packages/fault-benchmarker/benchmark-results.json']);
}
gulp.task('clean', clean);

function copyPipes(stream, l, dir) {
  return stream
    .pipe(changed('.', { transformPath: createSrcDirSwapper(dir) }))
    .pipe(simplePipeLogger(l, 'Copying'))
    .pipe(
      rename(filePath => {
        filePath.dirname = swapSrcWith(filePath.dirname, dir);
        return filePath;
      }),
    )
    .pipe(gulp.dest('.'));
}

function copyScript() {
  const l = logger.child({ tags: [chalk.yellow('copy'), chalk.blueBright('lib')] });
  return copyPipes(packagesSrcMiscStream(), l, 'lib');
}

function copyEsm() {
  const l = logger.child({ tags: [chalk.yellow('copy'), chalk.cyanBright('esm')] });
  return copyPipes(packagesSrcMiscStream(), l, 'esm');
}

const copy = gulp.parallel(copyScript, copyEsm);

function transpilePipes(stream, babelOptions, dir, chalkFn) {
  const sourcemaps = require('gulp-sourcemaps');
  const babel = require('gulp-babel');
  const l = logger.child({ tags: [chalk.blue('transpile'), chalkFn(dir)] });

  return stream
    .pipe(changed('.', { extension: '.js', transformPath: createSrcDirSwapper(dir) }))
    .pipe(simplePipeLogger(l, 'Transpiling'))
    .pipe(sourcemaps.init())
    .pipe(babel(babelOptions))
    .pipe(
      rename(filePath => {
        filePath.dirname = swapSrcWith(filePath.dirname, dir);
        return filePath;
      }),
    )
    .pipe(sourcemaps.mapSources(filePath => filePath.replace(/.*\/src\//g, '../src/')))
    .pipe(sourcemaps.write('.'));
}

function transpileScript() {
  return transpilePipes(packagesSrcCodeStream(), undefined, 'lib', chalk.blueBright).pipe(
    gulp.dest('.'),
  );
}

function transpileEsm() {
  return transpilePipes(
    packagesSrcCodeStream(),
    {
      envName: 'esm',
    },
    'esm',
    chalk.cyanBright,
  ).pipe(gulp.dest('.'));
}

function prettierPipes(stream) {
  const prettier = require('gulp-prettier');
  const l = logger.child({ tags: [chalk.magentaBright('prettier')] });
  return stream.pipe(simplePipeLogger(l, 'Formatting')).pipe(prettier());
}

function lintPipes(stream, lintOptions) {
  const eslint = require('gulp-eslint');

  const l = logger.child({ tags: [chalk.magenta('eslint')] });
  return (
    stream
      .pipe(simplePipeLogger(l, 'Formatting'))
      .pipe(eslint(lintOptions))
      .pipe(eslint.format())
      // TODO: Need to halt build process/throw error
      .pipe(eslint.failAfterError())
  );
}

function formatPipes(stream) {
  return prettierPipes(lintPipes(stream, { fix: true }));
}

function printFriendlyAbsoluteDir(dir) {
  if (relative(dir, __dirname) === '') {
    return '.';
  }
  return relative(join(__dirname), dir);
}

const transpile = gulp.parallel(transpileScript, transpileEsm);
gulp.task('transpile', transpile);

async function writeme() {
  const { writeReadmeFromPackageDir } = require('@writeme/core');
  const l = logger.child({ tags: [chalk.green('writeme')] });
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

const build = gulp.series(gulp.parallel(copy, transpile), writeme);
gulp.task('build', build);

gulp.task('watch', function watch() {
  gulp.watch(
    sourceGlobFromPackagesDirName(packagesDirName),
    { ignoreInitial: false, events: 'all' },
    gulp.parallel(copy, transpile),
  );
});

gulp.task('default', build);

function formatPrettier() {
  return prettierPipes(codeStream()).pipe(gulp.dest('.'));
}
gulp.task('format:prettier', formatPrettier);

function formatStagedPrettier() {
  return prettierPipes(codeStream().pipe(staged())).pipe(gulp.dest('.'));
}
gulp.task('format-staged:prettier', formatStagedPrettier);

function formatStagedLint() {
  return lintPipes(codeStream().pipe(staged()), { fix: true });
}
formatStagedLint.description =
  'Corrects any automatically fixable linter warnings or errors. Note that this command will ' +
  'overwrite files without creating a backup.';
gulp.task('format-staged:lint', formatStagedLint);

function format() {
  return formatPipes(codeStream()).pipe(gulp.dest('.'));
}
gulp.task('format', format);

function formatStaged() {
  return formatPipes(codeStream().pipe(staged())).pipe(gulp.dest('.'));
}
gulp.task('format-staged', formatStaged);

let withTypeCheckPipes = stream => {
  const typescript = require('typescript');
  const gulpTypescript = require('gulp-typescript');
  const tsProject = gulpTypescript.createProject('tsconfig.json', { typescript });

  withTypeCheckPipes = stream => {
    return stream.pipe(tsProject(gulpTypescript.reporter.defaultReporter()));
  };

  return withTypeCheckPipes(stream);
};

function checkTypes() {
  return withTypeCheckPipes(packagesSrcCodeWithTsDefinitionsStream());
}
checkTypes.description =
  'Runs the TypeScript type checker on the codebase, displaying the output. This will display any ' +
  'serious errors in the code, such as invalid syntax or the use of incorrect types.';
gulp.task('check-types', checkTypes);

function checkTypesStaged() {
  return withTypeCheckPipes(packagesSrcCodeStream().pipe(staged()));
}
gulp.task('check-types-staged', checkTypesStaged);

async function testNoBuild() {
  const runner = require('@fault/runner');
  const passed = await runner.run({
    tester: '@fault/tester-mocha',
    testMatch: [
      './{packages,build-packages,test}/**/*.test.{js,jsx,ts,tsx}',
      '!./**/node_modules/**',
      '!./coverage',
      '!./{packages,build-packages}/*/{dist,lib,esm}/**/*',
      '!./packages/fault-benchmarker/projects/**',
    ],
    addons: [
      require('@fault/addon-sbfl').default({
        scoringFn: require('@fault/sbfl-dstar').default,
        faultFilePath: './faults/faults.json',
      }),
    ],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
    setupFiles: [
      'source-map-support/register',
      './test/require/babel',
      './test/helpers/globals',
    ],
    testerOptions: {
      sandbox: false,
    }
  });
  if (!passed) {
    process.exit(1);
  }
}

gulp.task('test', testNoBuild);

const precommit = gulp.series(
  gulp.parallel(gulp.series(formatStaged, transpile), copy),
  gulp.parallel(checkTypesStaged, testNoBuild, writeme),
);
gulp.task('precommit', precommit);

const prepublish = gulp.series(
  gulp.parallel(clean, format),
  gulp.parallel(transpile, copy, testNoBuild),
  gulp.parallel(checkTypes, writeme),
);
gulp.task('prepublish', prepublish);

gulp.task('ci-test', prepublish);
