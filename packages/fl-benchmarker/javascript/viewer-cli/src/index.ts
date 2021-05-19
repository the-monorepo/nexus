import createLogger from '@pshaw/logger';
import chalk from 'chalk';

const log = createLogger();

type SharedOptions = {
  mode: string;
};

export type BuildOptions = {
  resultsDir: string;
  outputDir: string;
} & SharedOptions;
export const build = async ({ mode, resultsDir, outputDir }) => {
  const l = log.child(chalk.blueBright('build'));
  l.info('Starting...');

  const [{ createConfig }, { webpack }] = await Promise.all([
    import('./webpack'),
    import('@pshaw/webpack'),
  ]);

  const config = await createConfig({ resultsDir, outputDir });

  webpack(
    {
      ...config,
      mode,
    },
    (err, stats) => {
      const hasStatsWarnings = stats.hasWarnings();
      const hasStatsErrors = stats.hasErrors();
      const hasErrErrors = err !== undefined && err !== null;
      if (hasErrErrors || hasStatsErrors || hasStatsWarnings) {
        if (hasErrErrors) {
          l.exception(err);
        }
        if (hasStatsErrors && hasStatsWarnings) {
          const info = stats.toJson();
          if (hasStatsErrors) {
            l.error(info.errors);
          }
          if (hasStatsWarnings) {
            l.warn(info.warnings);
          }
        }
      } else {
        l.info('Successfully built');
      }
    },
  );
};

export type WatchOptions = {
  port: number;
  resultsDir: string;
} & SharedOptions;
export const watch = async ({ port, mode, resultsDir }: WatchOptions) => {
  const l = log.child(chalk.magentaBright('serve'));
  l.info('Starting...');

  const [{ createConfig }, { webpack, WebpackDevServer }] = await Promise.all([
    import('./webpack'),
    import('@pshaw/webpack'),
  ] as const);

  const config = await createConfig({ resultsDir });

  const compiler = webpack({
    ...config,
    mode,
    devServer: {
      ...config.devServer,
      hot: true,
      historyApiFallback: true,
    },
  });
  const server = new WebpackDevServer(compiler, config.devServer);

  await new Promise((resolve) => server.listen(port, 'localhost', resolve));
};
