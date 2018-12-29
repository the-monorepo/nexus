import { resolve } from 'path';

import { ParserOptions } from '@babel/parser';
export type ProjectConfig = {
  // Setup files to use (E.g. Babel register to transpile files)
  setupFiles?: string[];
  // Name of the project
  testMatch?: string | string[];
  env?: { [s: string]: any };
  artificial?: boolean;
  tester?: string;
  testOptions?: {
    [s: string]: any;
  };
  babelOptions?: ParserOptions;
};

export type GlobbedConfig = {
  glob: string | string[];
} & ProjectConfig;

export type BenchmarkConfig = GlobbedConfig[];

export const config: BenchmarkConfig = [
  {
    glob: 'enzyme-{427,476,519}',
    testMatch: './test/*.js',
    setupFiles: [resolve(__dirname, './hooks/babel'), './withDom.js'],
    testOptions: {
      sandbox: false,
    },
    babelOptions: {
      sourceType: 'module',
      plugins: ['jsx'],
    },
  },
  {
    glob: 'enzyme-*',
    testMatch: './test/**/*.{js,jsx}',
    setupFiles: [resolve(__dirname, './hooks/babel'), './withDom.js'],
    testOptions: {
      sandbox: false,
    },
    babelOptions: {
      sourceType: 'module',
      plugins: ['jsx'],
    },
  },
  {
    glob: 'sinon-*',
    testMatch: './test/**/*-test.js',
    testOptions: {
      sandbox: false,
    },
  },
  {
    glob: 'quixbugs-*',
    testOptions: {
      sandbox: true,
    },
    babelOptions: {
      sourceType: 'module',
    },
    setupFiles: [
      resolve(__dirname, './hooks/babel'),
      resolve(__dirname, './hooks/full-error-message'),
    ],
    artificial: true,
  },
  {
    glob: 'node-convict-*',
    testMatch: './test/*-tests.js',
    testOptions: {
      sandbox: false,
    },
  },
  {
    glob: 'chai-*',
    testMatch: './test/*.js',
    testOptions: {
      sandbox: false,
      require: ['./test/bootstrap'],
    },
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  },
  {
    glob: 'yargs-*',
    testMatch: './test/*.js',
    testOptions: {
      require: ['./test/before'],
      sandbox: false,
    },
  },
];

export default config;
