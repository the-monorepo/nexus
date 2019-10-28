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

export const runMochaInstance = async (mochaInstance, runHandle) => {
  return new Promise((resolve, reject) => {
    try {
      mochaInstance.run(async failures => {
        try {
          await runHandle(failures);
          resolve(failures);
        } catch(err) {
          reject(err);
        }
      });  
    } catch(err) {
      reject(err);
    }
  });
};
