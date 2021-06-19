// Note: Needs to be before transpilation hook because of cinder/babel

import { readFileSync, accessSync, constants } from 'fs';

import Module from 'module';

import { join, resolve } from 'path';

import globby from 'globby';

import config from '@monorepo/config';

const packageDirs = globby.sync(config.workspaces, {
  onlyDirectories: true,
});

const workspacedPackageNames = new Map();
for (const dir of packageDirs) {
  const jsonFilePath = join(dir, 'package.json');

  try {
    accessSync(jsonFilePath, constants.R_OK);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    continue;
  }
  const json = JSON.parse(readFileSync(jsonFilePath, 'utf8'));

  if (json.exports === undefined || typeof json.exports === 'string') {
    continue;
  }

  const monorepoOriginalPath = json.exports['monorepo-original'];
  if (monorepoOriginalPath !== undefined) {
    if (typeof monorepoOriginalPath === 'string') {
      const mappedResolvedRequirePath = resolve(dir, monorepoOriginalPath);
      workspacedPackageNames.set(json.name, mappedResolvedRequirePath);
    } else {
      for (const [relativeRequirePath, mappedRequirePath] of Object.entries<string>(
        monorepoOriginalPath,
      )) {
        const packageResolvedRequirePath = join(json.name, relativeRequirePath);
        const mappedResolvedRequirePath = resolve(dir, mappedRequirePath);
        workspacedPackageNames.set(packageResolvedRequirePath, mappedResolvedRequirePath);
      }
    }
  } else {
    for (const [relativeRequirePath, mappings] of Object.entries<string>(
      json.exports,
    )) {
      const mappedRequirePath = mappings['monorepo-original'];

      if (mappedRequirePath === undefined) {
        continue;
      }

      const packageResolvedRequirePath = join(json.name, relativeRequirePath);
      const mappedResolvedRequirePath = resolve(dir, mappedRequirePath);
      workspacedPackageNames.set(packageResolvedRequirePath, mappedResolvedRequirePath);
    }
  }
}

const { require: oldRequire } = Module.prototype;

Module.prototype.require = function require(filePath, ...other) {
  const patchedFilePath = (() => {
    if (workspacedPackageNames.has(filePath)) {
      return workspacedPackageNames.get(filePath)!;
    } else {
      return filePath;
    }
  })();
  return oldRequire.apply(this, [patchedFilePath, ...other]);
};
