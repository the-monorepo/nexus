export const run = async () => {
  const [nodePath, filePath, modulePath, optionsJson, importPathJson] = process.argv;
  const testerOptions = JSON.parse(optionsJson);
  const importPaths = JSON.parse(importPathJson);
  for (const importPath of importPaths) {
    const requiredModule = require(require.resolve(importPath, {
      paths: [process.cwd()],
    }));

    if (requiredModule !== undefined) {
      if (typeof requiredModule === 'function') {
        await Promise.resolve(requiredModule());
      } else if (typeof requiredModule.default === 'function') {
        await Promise.resolve(requiredModule.default());
      }
    }
  }

  const runner = require(require.resolve(modulePath, {
    paths: [process.cwd()],
  })).default;
  try {
    await Promise.resolve(runner(testerOptions));
  } catch (err) {
    console.error(err);
  }
};

run().catch(console.error);
