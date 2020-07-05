const run = async () => {
  const [, , modulePath, optionsJson, importPathJson] = process.argv;
  const testerOptions = JSON.parse(optionsJson);
  const importPaths = JSON.parse(importPathJson);
  for (const importPath of importPaths) {
    const resolvedImportPath = require.resolve(importPath, {
      paths: [process.cwd()],
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const requiredModule = require(resolvedImportPath);

    if (requiredModule !== undefined) {
      if (typeof requiredModule === 'function') {
        await requiredModule();
      } else if (typeof requiredModule.default === 'function') {
        await requiredModule.default();
      }
    }
  }

  const resolvedModulePath = require.resolve(modulePath, {
    paths: [process.cwd()],
  });

  const { default: runner } = await import(resolvedModulePath);
  await runner(testerOptions);
};

run().catch(console.error);
