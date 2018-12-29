import through from 'through2';
import chalk from 'chalk';

export const simplePipeLogger = (l) => {
  return through.obj((file, enc, callback) => {
    l.info(`'${chalk.cyanBright(file.relative)}'`);
    callback(null, file);
  });
};
