export const run = async () => {
  try {
    const [nodePath, filePath, modulePath, testPath] = process.argv;
    const runner = require(modulePath).default;
    try {
      await Promise.resolve(runner(testPath));
    } catch (err) {
      console.error(err);
    }
  } catch (err) {
    console.error(err);
  }
};

export default run;
run();
