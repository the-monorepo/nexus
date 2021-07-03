import writeReadmeFromPackageDir from '@writeme/core';
import chalk from 'chalk';

import logger from './utils/logger.ts';

import { join, relative } from 'path';

const rootDir = process.cwd();

const printFriendlyAbsoluteDir = (dir) => {
  if (relative(dir, rootDir) === '') {
    return '.';
  }
  return relative(join(rootDir), dir);
};

const writeme = async () => {
  const l = logger.child(chalk.greenBright('writeme'));
  await writeReadmeFromPackageDir(rootDir, {
    before: {
      genReadme: async ({ packageDir }) => {
        l.info(`Generating '${chalk.cyanBright(printFriendlyAbsoluteDir(packageDir))}'`);
      },
    },
    after: {
      readConfig: async ({ config, configPath }) => {
        if (!config) {
          l.warn(`Missing '${chalk.cyanBright(printFriendlyAbsoluteDir(configPath))}'`);
        }
      },
    },
    on: {
      error: async (err) => {
        l.error(err.stack);
      },
    },
  });
};

export const description = 'Generates README doco';

export default writeme;
