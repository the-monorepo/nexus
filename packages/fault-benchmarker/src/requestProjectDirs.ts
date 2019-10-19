import { resolve } from 'path';
import globby from 'globby';

export const requestProjectDirs = async (path: string | string[] = '*') => {
  const projectsDir = './projects';
  const resolved =
    typeof path === 'string'
      ? resolve(projectsDir, path)
      : path.map(glob => resolve(projectsDir, glob));
  const dirs = await globby(resolved, { onlyDirectories: true, expandDirectories: false });
  return dirs;
};
