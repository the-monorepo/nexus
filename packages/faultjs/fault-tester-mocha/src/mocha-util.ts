import * as resultful from 'resultful';

import { IPCReporter } from './recordTests.ts';

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

export const runMochaInstance = (
  mochaInstance,
): Promise<resultful.Result<undefined, any, any>> =>
  new Promise((resolve) => {
    try {
      mochaInstance.run((failures) => {
        if (failures) {
          resolve(resultful.createErrorFailure(failures));
        } else {
          resolve(resultful.createPayload(undefined));
        }
      });
    } catch (err) {
      resolve(resultful.createUnknownFailure(err));
    }
  });
