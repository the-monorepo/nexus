import * as resultful from 'resultful';

import { IPCReporter } from './recordTests';

export const createMochaInstance = (Mocha, options, requireFiles: string[]) => {
  const mochaInstance = new Mocha({
    color: true,
    reporter: IPCReporter,
    fullStackTrace: true,
    ...options,
  } as any);

  for (const requireFile of requireFiles) {
    mochaInstance.addFile(requireFile);
  }

  mochaInstance.addFile(require.resolve('./recordTests'));

  return mochaInstance;
};

export const runMochaInstance = (mochaInstance, runHandle) =>
  new Promise((resolve) => {
    try {
      mochaInstance.run((failures) => {
        if (failures) {
          resolve(resultful.error(failures));
        } else {
          resolve(resultful.success(undefined));
        }
      });
    } catch (err) {
      resolve(resultful.exception(err));
    }
  });
