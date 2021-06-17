import { globToRegExp } from "https://deno.land/std/path/glob.ts";
import { walk } from 'https://deno.land/std/fs/walk.ts';
import { exists } from 'https://deno.land/std@0.95.0/fs/exists.ts';
import { join, normalize } from 'https://deno.land/std/path/mod.ts';

const dirnameURL = new URL('.', import.meta.url);

const { workspaces } = JSON.parse(await Deno.readTextFile(join(dirnameURL.pathname, 'package.json')));
const iterable = walk('.', {
  match: workspaces.map(globToRegExp),
  includeFiles: false,
  includeDirs: true,
});

const imports: Record<string, string> = {
};

const addPackageJsonPaths = (packageJson: Record<string, any>, basePath: string) => {
  imports[`${packageJson.name}/`] = './' + join(basePath, '/');
  if (packageJson.exports !== undefined) {
    const isMainExportsOnly = Object.values(packageJson.exports).every(val => typeof val === 'string');
    if (isMainExportsOnly) {
      if (packageJson.exports.import !== undefined) {
        imports[packageJson.name] = './' + join(basePath, packageJson.exports.import);
      } else if (packageJson.exports.default !== undefined) {
        imports[packageJson.name] = './' + join(basePath, packageJson.exports.default);
      }
    } else {
      for (const [path, mapping] of Object.entries<any>(packageJson.exports)) {
        const importPath = join(packageJson.name, path);

        if (typeof mapping === 'string') {
          imports[importPath] = './' + join(basePath, mapping);
        } else if (mapping.import !== undefined) {
          imports[importPath] = './' + join(basePath, mapping.import);
        } else if (mapping.default !== undefined) {
          imports[importPath] = './' + join(basePath, mapping.default);
        }
      }
    }
  } else if (packageJson.module !== undefined) {
    imports[packageJson.name] = './' + join(basePath, packageJson.module);
  } else if (packageJson.main !== undefined) {
    imports[packageJson.name] = './' + join(basePath, packageJson.main);
  }
}

for await (const i of iterable) {
  const relativePath = './' + i.path;
  console.log(relativePath);

  const packageJson = JSON.parse(await Deno.readTextFile(join(dirnameURL.pathname, i.path, 'package.json')))
  addPackageJsonPaths(packageJson, relativePath);
  for (const [packageName, version] of Object.entries(packageJson.dependencies ?? [])) {
    if (/^workspace/.test(version as string)) {
      continue
    }

    const modulePath = `./node_modules/${packageName}/`;
    const modulePackageJsonPath = join(modulePath, 'package.json');

    const nestedModulePath = './' + join(i.path, modulePath);
    const nestedModulePackageJsonPath = './' + join(nestedModulePath, 'package.json');

    console.log(modulePath);
    imports[`${packageName}/`] = modulePath;

    if (await exists(modulePackageJsonPath)) {
      const dependencyPackageJson = JSON.parse(await Deno.readTextFile(modulePackageJsonPath));
      addPackageJsonPaths(dependencyPackageJson, modulePath);
    } else if (await exists(nestedModulePackageJsonPath)) {
      const dependencyPackageJson = JSON.parse(await Deno.readTextFile(nestedModulePackageJsonPath));
      addPackageJsonPaths(dependencyPackageJson, nestedModulePath);
    }
  }
}

await Deno.writeTextFile('local.import-map.json', JSON.stringify({ imports }, undefined, 2));
