import { readdir } from 'fs/promises';
import { resolve } from 'path';

import * as micromatch from 'micromatch';
export const requestProjectDirs = async (path: string | string[] = '*') => {
  const projectsDir = resolve(__dirname, '../projects');

  const projectNames = Array.isArray(path) ? path : [path];
  const globs = projectNames.map((name) => `${name}*`);

  const projectDirs = await readdir(projectsDir);

  const matched = micromatch.default(projectDirs, globs);

  const resolved = matched.map((projectDir) => resolve(projectsDir, projectDir));

  return resolved;
};
