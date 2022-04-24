import minimist from 'minimist';
import { webpack } from '@pshaw/webpack';
import { isMatch } from 'micromatch';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

export const webpackCompilers = async () => {
  const { default: webpackConfigs } = await import(
    resolve(process.cwd(), 'webpack.config.ts')
  );

  const args = minimist(process.argv.slice(2));

  const {
    name = ['*'],
    mode = (process.env.NODE_ENV ?? 'development') === 'production' ? 'prod' : 'dev',
    http = false,
  } = args;

  const httpsConfig = await (async () => {
    if (http) {
      return undefined;
    }

    const existsThenRead = async (path: string) => {
      if (!existsSync(path)) {
        // TODO: Need a better message
        throw new Error(
          `${path} is missing. Please create a ${path} or run with --http flag`,
        );
      }

      return await readFile(path);
    };

    const [key, crt] = await Promise.all([
      existsThenRead('./localhost.key'),
      existsThenRead('./localhost.crt'),
    ]);

    return {
      key,
      cert: crt,
    };
  })();

  const names = Array.isArray(name) ? name : [name];

  return webpackConfigs
    .filter((config) => isMatch(config.name, names))
    .map((config) => {
      const mergedConfig = {
        mode: mode === 'prod' ? 'production' : 'development',
        ...config,
        devServer: {
          ...config.devServer,
          server: config.devServer.server ?? {
            ...config.devServer.server,
            type: 'https',
            options: httpsConfig
          },
        },
      };
      return {
        config: mergedConfig,
        // TODO: Fix
        compiler: webpack(mergedConfig as any),
      };
    });
};
