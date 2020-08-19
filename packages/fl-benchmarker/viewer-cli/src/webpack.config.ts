import { resolve } from 'path';
import { createHtmlWebpackPlugin, createDistOutput, Configuration, resolvedExtensions, recommendedRules } from '@pshaw/webpack';

const config: Configuration = {
  name: "fault-benchmark",
  target: "web",
  resolve: {
    extensions: resolvedExtensions,
  },
  devtool: "source-map",
  module: {
    rules: recommendedRules,
  },
  entry: resolve(__dirname, "ui/temp.tsx"),
  output: createDistOutput(resolve(__dirname, 'temp')),
  plugins: [
    createHtmlWebpackPlugin({
      title: `Fault benchmarker results`,
    }),
  ],
  devServer: {
    port: 3001,
    compress: true,
  },
};

export default config;