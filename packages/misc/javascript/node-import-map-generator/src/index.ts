import { readFile, writeFile, stat } from 'fs/promises';
import { dirname, join, relative, normalize } from 'path';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
const imports: Record<string, string> = {};
const scopes: Record<string, Record<string, string>> = {};

const exportValueJoin = (...args) => {
  const joined = join(...args);

  if (args[args.length - 1].endsWith('/') && !joined.endsWith('/')) {
    return `${joined}/`;
  } else {
    return joined;
  }
};

const normalizeToRelative = (path: string) => {
  const normalized = normalize(path);
  return /^\.*\//.test(normalized) ? normalized : `./${normalized}`;
};
const resolveForImportKey = (path: string) => {
  return normalizeToRelative(`${relative(process.cwd(), path)}/`);
};

const resolveForImportAliasPath = (path: string) => {
  const normalized = normalizeToRelative(relative(process.cwd(), path));
  if (path.endsWith('/')) {
    return `${normalized}/`;
  }
  return normalized;
};

const requireResolveForImportAliasPath = (path: string, requireCwd: string) => {
  if (path.endsWith('/')) {
    return resolveForImportAliasPath(path);
  }
  return resolveForImportAliasPath(require.resolve(path, { paths: [requireCwd] }));
};

const addImportsFromDependencies = async (
  dependencies: Record<string, string> | undefined = {},
  cwd: string,
) => {
  const stack = [{ dependencies, cwd }];
  const seen: Set<string> = new Set();
  while (stack.length > 0) {
    const popped = stack.pop()!;
    const { dependencies: deps, cwd: currentCwd } = popped;
    for (const packageName of Object.keys(deps)) {
      const key = `${packageName}_${currentCwd}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const importInfo = await addImportsFromPackageName(packageName, currentCwd);
      stack.unshift(importInfo);
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
    Object.keys(require.cache).forEach(function (key) {
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

type RecursiveArray<T> = Array<RecursiveArray<T> | T>;
type RecursiveRecord<T> = Record<string, RecursiveRecord<T> | T>;

type ExportMapping =
  | RecursiveArray<ExportMapping>
  | RecursiveRecord<ExportMapping>
  | string;

const exportMappingToPath = (mapping: ExportMapping): string | undefined => {
  if (typeof mapping === 'string') {
    return mapping;
  } else if (Array.isArray(mapping)) {
    for (const subMapping of mapping) {
      const entrypoint = exportMappingToPath(subMapping);
      if (entrypoint !== undefined) {
        return entrypoint;
      }
    }
  } else {
    const chosenExportMapping = mapping['monorepo-original-deno'] ?? mapping['monorepo-original'] ?? mapping.deno ?? mapping.import ?? mapping.default;

    if (chosenExportMapping !== undefined) {
      return exportMappingToPath(chosenExportMapping);
    }
  }

  return undefined;
};

type Exports = Record<string, ExportMapping> | ExportMapping;

const exportsToEntrypoints = (
  exportsObject: Exports,
  packageName: string,
  packageDir: string,
): [string, string][] => {
  const isMultiMappings = Object.keys(exportsObject).every((key) => key.startsWith('.'));

  if (isMultiMappings) {
    return Object.entries(exportsObject)
      .map(([key, exportsValue]) => {
        const mapped = exportMappingToPath(exportsValue);

        if (mapped === undefined) {
          return undefined;
        }

        try {
          return [
            join(packageName, key),
            requireResolveForImportAliasPath(
              exportValueJoin(packageDir, mapped),
              packageDir,
            ),
          ] as [string, string];
        } catch (err) {
          console.error(err);
          return undefined;
        }
      })
      .filter((value): value is Exclude<typeof value, undefined> => value !== undefined);
  } else {
    const mapped = exportMappingToPath(exportsObject);

    if (mapped === undefined) {
      return [];
    }

    try {
      return [
        [
          packageName,
          requireResolveForImportAliasPath(
            exportValueJoin(packageDir, mapped),
            packageDir,
          ),
        ],
      ];
    } catch (err) {
      console.error(err);
      return [];
    }
  }
};

const entryPointsFromPackageJson = (
  json: Record<string, any>,
  packageName: string,
  packageDir: string,
) => {
  if (json.exports !== undefined) {
    return exportsToEntrypoints(json.exports, packageName, packageDir);
  } else {
    const main = json.module ?? json.main;
    const mappings: [string, string][] =
      main === undefined
        ? []
        : [
            [
              packageName,
              requireResolveForImportAliasPath(join(packageDir, main), packageDir),
            ],
          ];
    return [
      // E.g. @x/y
      [`${packageName}/`, `${resolveForImportAliasPath(packageDir)}/`],
      ...mappings,
    ];
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
      if (!packageName.startsWith('@types')) {
        // TODO: Should be a way of disabling this
        // @types/ files have main: ""
        console.error(
          `Tried to resolve '${packageName}' at '${cwd}' but received ${err.code}`,
          err,
        );
      }
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
      } while (current !== '/' && current !== '.');
    } catch (err) {
      reject(err);
      throw err;
    }
  })();

  return promise;
};

const main = async () => {
  yargs(hideBin(process.argv))
    .command({
      command: '*',
      builder: (builder) => builder.option('input-path',  {
        alias: 'i',
        type: 'string',
        default: join(process.cwd(), 'package.json')
      }).option('output-path', {
        alias: 'o',
        type: 'string',
        default: join(process.cwd(), 'node.import-map.json')
      }),
      handler: async ({
        inputPath,
        outputPath,
      }) => {
        const entryPath = dirname(inputPath);
        try {
          const rootPackageJson = JSON.parse(
            await readFile(inputPath, 'utf8'),
          );
          await addImportsFromDependencies(rootPackageJson.dependencies, entryPath);

          await writeFile(
            outputPath,
            JSON.stringify({ imports, scopes }, undefined, 2),
            'utf8',
          );
        } catch (err) {
          console.error(err);
        }
      }
    }).argv
};

main();
