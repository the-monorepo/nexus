import { readFile, writeFile, stat } from 'fs/promises';
import { dirname, join } from 'path';
import { exit } from 'process';
process.exit = (...args) => {
  console.log('hm');
  exit(...args);
}
process.on('beforeExit', (code) => {
  console.log('Process beforeExit event with code: ', code);
});

process.on('exit', (code) => {
  console.log('Process exit event with code: ', code);
});
process.on('uncaughtException', (err, origin) => {
  console.log(
    err,
    origin
  );
});

process.on('warning', (warning) => {
  console.warn(warning.name);    // Print the warning name
  console.warn(warning.message); // Print the warning message
  console.warn(warning.stack);   // Print the stack trace
});

const imports: Record<string, string> = {};
const scopes: Record<string, Record<string, string>> = {};

const exportsToScopeEntries = (
  packageName: string,
  packageDir: string,
  exportValue: string | Record<string, string>,
): [string, string][] => {
  if (typeof exportValue === 'string') {
    return [[packageName, join(packageDir, exportValue)]];
  } else {
    return Object.entries(exportValue).map(([relativeEntrypoint, relativeMapping]) => {
      const packageEntrypoint = join(packageName, relativeEntrypoint);

      const mapping = join(packageDir, relativeMapping);

      return [packageEntrypoint, mapping];
    });
  }
};

const addImportsFromDependencies = async (
  dependencies: Record<string, string> | undefined = {},
  cwd: string,
) => {
  for (const packageName of Object.keys(dependencies)) {
    try {
      await addImportsFromPackageName(packageName, cwd);
    } catch(err) {
      console.error(err);
    }
  }
  /*await Promise.allSettled(
    Object.keys(dependencies).map((packageName) =>
      addImportsFromPackageName(packageName, cwd),
    ),
  );*/
};

const jsonCache = new Map();
const readJson = (aPath: string) => {
  if (jsonCache.has(aPath)) {
    return jsonCache.get(aPath)!;
  }

  const parsed = (async () => {
    const text = await readFile(aPath, 'utf8');

    return JSON.parse(text);
  })();

  jsonCache.set(aPath, parsed);

  return parsed;
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
    if (json.exports.import !== undefined) {
      return exportsToScopeEntries(packageName, packageDir, json.exports.import);
    } else if (json.exports.default !== undefined) {
      return exportsToScopeEntries(packageName, packageDir, json.exports.default);
    }
    return [];
  } else {
    const main = json.module ?? json.main;
    const mappings: [string, string][] = (main === undefined ? [] : [[packageName, join(packageDir, main)]]);
    return [
      // E.g. @x/y
      [packageName + '/', packageDir + '/'],
      ...mappings,
    ]
  }
};
const importCache = new Map();
const addImportsFromPackageName = (packageName: string, cwd: string) => {
  const key = packageName + '_' + cwd;
  if (importCache.has(key)) {
    console.log('reusing', packageName, cwd, importCache.size);
    const value = importCache.get(key)!;
    console.log(value);
    return;
  }
  console.log('caching', packageName, cwd, importCache.size);

  const promise = (async () => {
    try {
      const aPath = tryResolvePackage(packageName, cwd);
      const packageJsonPath = await findAssociatedPackageJsonForPath(aPath);

      const json = await readJson(packageJsonPath);

      const packageDir = dirname(packageJsonPath);



      await addImportsFromDependencies(json.dependencies, packageDir);

      scopes[cwd] = {
        ...scopes[cwd],
        ...Object.fromEntries(entryPointsFromPackageJson(json, packageName, packageDir)),
      };
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        return;
      }
      console.error(err, packageName, [cwd]);
      throw err;
    }
  })();

  importCache.set(key, promise);

  return promise;
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
            console.error(err);
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
    console.log({ scopes });

    await writeFile(
      'local.import-map.json',
      JSON.stringify({ imports, scopes }, undefined, 2),
      'utf8',
    );
  } catch (err) {
    console.log(err);
  }
};

main();
