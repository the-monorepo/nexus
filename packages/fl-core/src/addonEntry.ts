export const run = async () => {
  try {
    const [nodePath, filePath, modulePath, testPathsJson, importPathJson] = process.argv;
    const testPaths = JSON.parse(testPathsJson);
    const importPaths = JSON.parse(importPathJson);
    for (const importPath of importPaths) {
      const requiredModule = require(importPath);
      if (requiredModule !== undefined) {
        if (typeof requiredModule === 'function') {
          await Promise.resolve(requiredModule());
        } else if (typeof requiredModule.default === 'function') {
          await Promise.resolve(requiredModule.default());
        }
      }
    }
    const runner = require(modulePath).default;
    try {
      await Promise.resolve(runner(testPaths));
    } catch (err) {
      console.error(err);
    }
  } catch (err) {
    console.error(err);
  }
};

export default run;
run();
