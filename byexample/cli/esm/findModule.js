"use strict";

export function findModule(moduleName) {
  var prefixes = ['@byexample/', 'byexample-', ''];
  var compiledModuleNames = prefixes.map(prefix => prefix + moduleName);
  var aModule = undefined;
  var finalModuleName = undefined;
  var i = 0;

  while (!aModule && i < compiledModuleNames.length) {
    finalModuleName = compiledModuleNames[i];
    aModule = require(finalModuleName);
    i++;
  }

  if (!aModule) {
    throw new Error("Could not find module using any of the following: ".concat(compiledModuleNames.join(', ')));
  }

  return {
    module: aModule,
    name: finalModuleName
  };
}
//# sourceMappingURL=findModule.js.map
