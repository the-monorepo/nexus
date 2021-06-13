// TODO: Maybe disable this rule for this package
/* eslint-disable no-console */
import { spawn } from 'child_process';

import { resolve } from 'path';

import globby from 'globby';

const main = async () => {
  const projectsDir = './projects';
  const path = ['*'];
  const resolved =
    typeof path === 'string'
      ? resolve(projectsDir, path)
      : path.map((glob) => resolve(projectsDir, glob));
  const projectDirs = await globby(resolved, {
    onlyDirectories: true,
    expandDirectories: false,
  });
  for (const projectDir of projectDirs) {
    const resolvedProjectDir = resolve(__dirname, '..', projectDir);
    console.log(`Installing for ${resolvedProjectDir}`);
    const packagePaths = await globby(resolve(resolvedProjectDir, 'yarn.lock'), {
      onlyFiles: true,
      expandDirectories: false,
    });

    const args = ['install'];
    if (packagePaths.length > 0) {
      args.push('--pure-lockfile');
    }
    const p = spawn(packagePaths.length > 0 ? 'yarn' : 'npm', args, {
      cwd: resolvedProjectDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: undefined,
      },
    });
    await new Promise((resolve, reject) => {
      p.addListener('error', reject);
      p.addListener('exit', (code, signal) => {
        if (code !== 0) {
          reject({ code, signal });
        } else {
          resolve();
        }
      });
    });
  }
};
main().catch(console.error);
