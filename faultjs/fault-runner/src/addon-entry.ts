export const run = async () => {
  const [, , modulePath, optionsJson, importPathJson] = process.argv;
  const testerOptions = JSON.parse(optionsJson);
  const importPaths = JSON.parse(importPathJson);
  for (const importPath of importPaths) {
    console.log('cwd', process.cwd(), process.execPath, process.execArgv);
    const resolvedImportPath = require.resolve(importPath, {
      paths: [process.cwd()],
    });
    console.log('????', resolvedImportPath);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const requiredModule = require(resolvedImportPath);

    if (requiredModule !== undefined) {
      if (typeof requiredModule === 'function') {
        await Promise.resolve(requiredModule());
      } else if (typeof requiredModule.default === 'function') {
        await Promise.resolve(requiredModule.default());
      }
    }
  }

  const resolvedModulePath = require.resolve(modulePath, {
    paths: [process.cwd()],
  });
  const runner = require(resolvedModulePath).default;
  try {
    await Promise.resolve(runner(testerOptions));
  } catch (err) {
    console.error(err);
  }
};

run().catch(console.error);
