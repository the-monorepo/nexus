import { resolve } from 'path';

import {
  createHtmlWebpackPlugin,
  createOutput,
  recommendedWebcomponentRules,
} from '@pshaw/webpack';
import { DefinePlugin } from '@pshaw/webpack/webpack';

import { readFileSync } from 'fs';

export type CreateConfigOptions = {
  resultsDir: string;
  outputDir?: string | undefined;
};
export const createConfig = ({ resultsDir, outputDir }: CreateConfigOptions) => {
  const resolvedResultsDir = resolve(process.cwd(), resultsDir);
  const fileExample = resolve(
    resolvedResultsDir,
    'example-defect/example-technique/faults/faults.json',
  );

  return {
    name: 'fault-benchmark',
    target: 'web',
    devtool: 'source-map',
    module: {
      rules: recommendedWebcomponentRules,
    },
    entry: require.resolve(resolve(__dirname, 'ui/temp')),
    output:
      outputDir !== undefined
        ? createOutput(resolve(process.cwd(), outputDir))
        : undefined,
    plugins: [
      createHtmlWebpackPlugin({
        title: `Fault benchmarker results`,
      }),
      new DefinePlugin({
        __FAULT_BENCHMARKER_DATA__: DefinePlugin.runtimeValue(() => {
          const faultData = readFileSync(fileExample, 'utf8');

          return faultData;
        }, [fileExample]),
      }),
    ],
    devServer: {
      port: 3001,
      compress: true,
      liveReload: true,
      watchContentBase: true,
    },
  };
};
