export function findModule(moduleName: string) {
  const prefixes = ['@byexample/', 'byexample-', ''];
  const compiledModuleNames = prefixes.map((prefix) => prefix + moduleName);
  let aModule = undefined;
  let finalModuleName = undefined;
  let i = 0;
  while (!aModule && i < compiledModuleNames.length) {
    finalModuleName = compiledModuleNames[i];
    aModule = require(finalModuleName);
    i++;
  }
  if (!aModule) {
    throw new Error(
      `Could not find module using any of the following: ${compiledModuleNames.join(
        ', ',
      )}`,
    );
  }
  return { module: aModule, name: finalModuleName };
}
