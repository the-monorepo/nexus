import chalk from 'chalk';

import { webpackCompilers } from './utils/webpack-compilers.ts';
import logger from './utils/logger.ts';

// From: https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
const humanReadableFileSize = (size: number) => {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const humanReadableValue = size / Math.pow(1024, i);
  const roundedHumanReadableString = humanReadableValue.toFixed(2);
  return `${roundedHumanReadableString} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`;
};

const bundleWebpack = async () => {
  const compilers = await webpackCompilers();

  const compilersStatsPromises = compilers.map((info) => {
    return new Promise<any>((resolve, reject) => {
      info.compiler.run((err, stats) => {
        if (err) {
          reject(err);
        } else {
          resolve(stats);
        }
      });
    });
  });

  const l = logger.child(chalk.magentaBright('webpack'));
  for await (const stats of compilersStatsPromises) {
    const compilation = stats.compilation;
    const timeTaken = (stats.endTime - stats.startTime) / 1000;

    const messages: string[] = [];

    const filesMessage = Object.values<any>(compilation.assets)
      .map(
        (asset) =>
          ` - ${chalk.cyanBright(asset.existsAt)} ${chalk.magentaBright(
            humanReadableFileSize(asset.size()),
          )}`,
      )
      .join('\n');
    const bundleMessage = `Bundled: '${chalk.cyanBright(
      `${compilation.name}`,
    )}' ${chalk.magentaBright(`${timeTaken} s`)}`;
    messages.push(bundleMessage, filesMessage);

    if (stats.hasWarnings()) {
      messages.push(
        `${compilation.warnings.length} warnings:`,
        compilation.warnings
          .map((warning) => warning.stack)
          .map(chalk.yellowBright)
          .join('\n\n'),
      );
    }

    if (stats.hasErrors()) {
      messages.push(
        `${compilation.errors.length} errors:`,
        compilation.errors
          .map(chalk.redBright)
          .map((error) => (error.stack !== undefined ? error.stack : error))
          .join('\n\n'),
      );
    }
    const outputMessage = messages.join('\n');

    l.info(outputMessage);
  }
};

export default bundleWebpack;
