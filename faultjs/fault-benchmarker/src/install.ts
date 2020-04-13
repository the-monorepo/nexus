import { exec } from 'child_process';

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
    });
    const command = `${packagePaths.length > 0 ? 'yarn' : 'npm'} install ${
      packagePaths.length > 0 ? '--pure-lockfile' : ''
    }`;
    console.log(command);
    const p = exec(command, { cwd: resolvedProjectDir });
    await new Promise((resolve, reject) => {
      p.addListener('error', reject);
      p.addListener('exit', (code, signal) => {
        if (code !== 0) {
          reject();
        } else {
          resolve();
        }
      });

      p.stdout.on('data', function (data) {
        console.log(data.toString());
      });
    });
  }
};
main().catch(console.error);
