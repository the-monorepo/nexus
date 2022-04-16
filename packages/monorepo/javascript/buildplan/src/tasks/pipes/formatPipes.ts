import chalk from 'chalk';
import { simplePipeLogger } from '../utils/simplePipeLogger';

import logger from '../utils/logger';

import * as eslint from 'eslint';
import prettier from 'prettier';
import * as through2 from 'through2';

const prettierPipes = async (stream) => {
  const l = logger.child(chalk.magentaBright('prettier'));

  const prettierOptions = await prettier.resolveConfig();

  return stream.pipe(simplePipeLogger(l)).pipe(
    through2.obj(async (file, enc, callback) => {
      const formattedText = prettier.format(file.contents.toString(), prettierOptions);

      file.contents = Buffer.from(formattedText, 'utf8');

      callback(undefined, file);
    }),
  );
};

const lintPipes = async (stream, lintOptions) => {
  const l = logger.child(chalk.magentaBright('eslint'));

  const instance = new eslint.ESLint({ ...lintOptions, fix: false });
  const reporter = await instance.loadFormatter('unix');

  return stream.pipe(simplePipeLogger(l)).pipe(
    through2.obj(async (file, enc, callback) => {
      const results = await instance.lintText(file.contents.toString(), {
        filePath: file.path,
      });

      if (results.length > 0) {
        if (results.length > 1) {
          l.warn(`Received ${results.length} ESLint results for a single file`);
        }

        if (results[0].output !== undefined && lintOptions.fix) {
          file.contents = Buffer.from(results[0].output, 'utf8');
        }
      }

      const reportedText = await reporter.format(results);
      if (reportedText.length > 0) {
        process.stdout.write(`${reportedText}\n`);
      }

      callback(undefined, file);
    }),
  );
};

export const formatPipes = async (stream) => {
  return await prettierPipes(await lintPipes(stream, { fix: true }));
};
