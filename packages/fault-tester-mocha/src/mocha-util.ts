import { IPCReporter } from './recordTests';
export const createMochaInstance = (Mocha, requireFiles: string[]) => {
  const mochaInstance = new Mocha({
    color: true,
    reporter: IPCReporter,
    fullStackTrace: true,
  } as any);
  for (const requireFile of requireFiles) {
    mochaInstance.addFile(requireFile);
  }
  mochaInstance.addFile(require.resolve('./recordTests'));
  return mochaInstance;
};

export const runMochaInstance = async (mochaInstance, runHandle) => {
  try {
    await new Promise(resolve => {
      mochaInstance.run(async failures => {
        await runHandle(failures);
        resolve(failures);
      });
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
