import { readFile, writeFile, stat } from 'fs/promises';
import { dirname, join, relative, normalize } from 'path';

const imports: Record<string, string> = {};
const scopes: Record<string, Record<string, string>> = {};

const normalizeToRelative = (path: string) => {
  const normalized = normalize(path);
  return /^\.*\//.test(normalized) ? normalized : './' + normalized;
};
const resolveForImportKey = (path: string) => {
  return normalizeToRelative(relative(process.cwd(), path) + '/');
};

const resolveForImportAliasPath = (path: string) => {
  return normalizeToRelative(relative(process.cwd(), path));
};

const exportsToScopeEntries = (
  packageName: string,
  packageDir: string,
  exportValue: string | Record<string, string>,
): [string, string][] => {
  if (typeof exportValue === 'string') {
    return [[packageName, resolveForImportAliasPath(join(packageDir, exportValue))]];
  } else {
    return Object.entries(exportValue).map(([relativeEntrypoint, relativeMapping]) => {
      const packageEntrypoint = join(packageName, relativeEntrypoint);

      const mapping = join(packageDir, relativeMapping);

      return [packageEntrypoint, resolveForImportAliasPath(mapping)];
    });
  }
};

const addImportsFromDependencies = async (
  dependencies: Record<string, string> | undefined = {},
  cwd: string,
) => {
  let stack = [{ dependencies, cwd }];
  const seen: Set<string> = new Set();
  while(stack.length > 0) {
    const popped = stack.pop()!;
    const { dependencies: deps, cwd: currentCwd } = popped;
    for (const packageName of Object.keys(deps)) {
      const key = `${packageName}_${currentCwd}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      try {
        const importInfo =await addImportsFromPackageName(packageName, currentCwd);
        stack.unshift(importInfo);
      } catch(err) {
        throw err;
      }
    }
  }
  /*await Promise.allSettled(
    Object.keys(dependencies).map((packageName) =>
      addImportsFromPackageName(packageName, cwd),
    ),
  );*/
};

const readJson = async (aPath: string) => {
  const text = await readFile(aPath, 'utf8');

  return JSON.parse(text);
};

const tryResolvePackage = (packageName: string, cwd: string) => {
  try {
    Object.keys(require.cache).forEach(function(key) {
      delete require.cache[key];
    });
    return require.resolve(packageName, { paths: [cwd] });
  } catch (err) {
    if (err.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      return err.message.replace(/^.* in /, '');
    }
    throw err;
  }
};

const entryPointsFromPackageJson = (json: Record<string, any>, packageName: string, packageDir: string) => {
  if (json.exports !== undefined) {
    if (typeof json.exports === 'string') {
      return [
        [packageName, resolveForImportAliasPath(join(packageDir, json.exports))]
      ];;
    } else {
      const fileSpecificImports = Object.fromEntries(Object.entries(json.exports).filter(([key]) => key.startsWith('.')).map(([relativeFilePath, value]: any) => {
        return [relativeFilePath, value.import ?? value.default];
      }).filter(([, value]) => value !== undefined));
      return [
        ...exportsToScopeEntries(packageName, packageDir, json.exports.default ?? {}),
        ...exportsToScopeEntries(packageName, packageDir, json.exports.import ?? {}),
        ...exportsToScopeEntries(packageName, packageDir, fileSpecificImports),
      ];
    }
    return [];
  } else {
    const main = json.module ?? json.main;
    const mappings: [string, string][] = (main === undefined ? [] : [[packageName, resolveForImportAliasPath(join(packageDir, main))]]);
    return [
      // E.g. @x/y
      [packageName + '/', resolveForImportAliasPath(packageDir) + '/'],
      ...mappings,
    ]
  }
};
const addImportsFromPackageName = async (packageName: string, cwd: string) => {
  try {
    const aPath = tryResolvePackage(packageName, cwd);
    const packageJsonPath = await findAssociatedPackageJsonForPath(aPath);

    const json = await readJson(packageJsonPath);

    const packageDir = dirname(packageJsonPath);

    const importMapCwd = resolveForImportKey(cwd);
    scopes[importMapCwd] = {
      ...scopes[importMapCwd],
      ...Object.fromEntries(entryPointsFromPackageJson(json, packageName, packageDir)),
    };

    // Avoids deadlock
    return { dependencies: json.dependencies ?? {}, cwd: packageDir };
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      // TODO: Clean this up
      return { dependencies: {}, cwd: "shouldn't be needed" };
    }
    throw err;
  }
};

const packageJsonCache = new Map();
const findAssociatedPackageJsonForPath = (filePath: string) => {
  let current = dirname(filePath);
  let resolve;
  let reject;
  const promise = new Promise<string>((resolveInput, rejectInput) => {
    resolve = resolveInput;
    reject = rejectInput;
  });
  (async () => {
    try {
      do {
        if (packageJsonCache.has(current)) {
          const value = await packageJsonCache.get(current)!;
          resolve(value);
          return value;
        }
        packageJsonCache.set(current, promise);
        try {
          const packageJsonPath = join(current, 'package.json');
          const stats = await stat(packageJsonPath);
          if (stats.isFile()) {
            resolve(packageJsonPath);
            return packageJsonPath;
          }
        } catch (err) {
          if (err.code !== 'ENOTDIR' && err.code !== 'ENOENT' && err.code !== 'EISDIR') {
            throw err;
          }
        }
        current = dirname(current);
      } while (current !== '/' && current !== '.')
    } catch(err) {
      reject(err);
      throw err;
    }
  })();

  return promise;
};

const main = async () => {
  try {
    const rootPackageJson = JSON.parse(
      await readFile(join(__dirname, 'package.json'), 'utf8'),
    );
    await addImportsFromDependencies(rootPackageJson.dependencies, __dirname);

    await writeFile(
      'local.import-map.json',
      JSON.stringify({ imports, scopes }, undefined, 2),
      'utf8',
    );
  } catch (err) {
    console.error(err);
  }
};

main();
