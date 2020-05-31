import { readFileSync, accessSync, constants } from 'fs';

import Module from 'module';

import { join } from 'path';

import globby from 'globby';

import config from '@monorepo/config';

const packageDirs = globby.sync(config.workspaces, {
  onlyDirectories: true,
});

const packageJsonFilePaths = packageDirs.map((dir) => join(dir, 'package.json'));

const readablePackageJsonFilePaths = packageJsonFilePaths.filter((filePath) => {
  try {
    accessSync(filePath, constants.R_OK);
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return false;
  }
});

const packageJsons = readablePackageJsonFilePaths.map((filePath) =>
  JSON.parse(readFileSync(filePath, 'utf8')),
);

const workspacedPackageNames = new Map(
  packageJsons
    .filter(
      (json) =>
        json.exports !== undefined && json.exports['monorepo-original'] !== undefined,
    )
    .map((json) => [json.name, join(json.name, json.exports['monorepo-original'])]),
);

const { require: oldRequire } = Module.prototype;

Module.prototype.require = function require(filePath, ...other) {
  const patchedFilePath = (() => {
    if (workspacedPackageNames.has(filePath)) {
      return workspacedPackageNames.get(filePath);
    } else {
      return filePath;
    }
  })();
  return oldRequire.apply(this, [patchedFilePath, ...other]);
};
